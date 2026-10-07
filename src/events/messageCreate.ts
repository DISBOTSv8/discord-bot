import {
    Message,
} from "discord.js";

import {
    client,
} from "../client";

import {
    saveGuildMessage,
} from "../ai/openai";

import {
    askAI,
} from "../ai/askAI";

import {
    getAvailableCommandsPrompt,
} from "../moderation/commandCatalog";

import {
    executeModerationCommand,
} from "../moderation/executeModerationCommand";

import {
    resolveTargetMember,
} from "../moderation/resolveTargetMember";

import {
    getPendingCommand,
    removePendingCommand,
    setPendingCommand,
} from "../moderation/pendingCommands";

import {
    ParsedCommand,
} from "../moderation/moderationTypes";

import {
    recognizeCommand,
} from "../ai/commandRecognizer";

import {
    canModerate,
} from "../moderation/moderationPermissions";

const GHOST_TRIGGER_REGEX =
    /^(ghost|гост)(?:\s+|(?=[,!.?:;]|$))/iu;

const CONFIRMATION_REQUIRED =
    new Set([
        "warn",
        "timeout",
        "untimeout",
        "kick",
        "ban",
        "unban",
        "add_role",
        "remove_role",
        "nickname",
        "mute_voice",
    ]);

export async function handleMessageCreate(
    message: Message,
): Promise<void> {
    if (
        message.author.bot ||
        !message.guild
    ) {
        return;
    }

    const guild =
        message.guild;

    const displayName =
        message.member?.displayName ??
        message.author.globalName ??
        message.author.username ??
        message.author.id;

    const referencedMessage =
        message.reference?.messageId
            ? await message.fetchReference().catch(
                () => null,
            )
            : null;

    saveGuildMessage({
        id: message.id,
        guildId: guild.id,
        channelId: message.channelId,
        channelName:
            (
                "name" in message.channel
                    ? message.channel.name
                    : null
            ) ?? message.channelId,
        userId: message.author.id,
        displayName,
        content: message.content,
        timestamp:
        message.createdTimestamp,
        referenceMessageId:
        message.reference?.messageId,
    });

    if (
        message.mentions.everyone ||
        message.content.includes("@everyone") ||
        message.content.includes("@here")
    ) {
        return;
    }

    if (!message.channel.isSendable()) {
        return;
    }

    const pending =
        getPendingCommand(
            guild.id,
            message.author.id,
        );

    if (pending) {
        if (
            isCancellation(
                message.content,
            )
        ) {
            removePendingCommand(
                guild.id,
                message.author.id,
            );

            await message.channel.send(
                "Отменил.",
            );

            return;
        }

        if (
            isConfirmation(
                message.content,
            )
        ) {
            removePendingCommand(
                guild.id,
                message.author.id,
            );

            const result =
                await executeModerationCommand(
                    pending.command,
                    message,
                );

            await message.channel.send({
                content: result,
                allowedMentions: {
                    parse: [],
                },
            });

            return;
        }
    }

    const botUser =
        client.user;

    if (!botUser) {
        return;
    }

    const isMention =
        message.mentions.has(
            botUser,
        );

    const contentWithoutMention =
        message.content
            .replace(
                new RegExp(
                    `<@!?${botUser.id}>`,
                    "g",
                ),
                "",
            )
            .trim();

    const isGhostCall =
        GHOST_TRIGGER_REGEX.test(
            contentWithoutMention,
        );

    if (
        !isMention &&
        !isGhostCall
    ) {
        return;
    }

    const question =
        contentWithoutMention
            .replace(
                GHOST_TRIGGER_REGEX,
                "",
            )
            .trim();

    await message.channel.sendTyping();

    try {
        const mentionedUsers = [
            ...message.mentions.users.values(),
        ]
            .filter(
                user =>
                    user.id !== botUser.id,
            )
            .map(user => ({
                id: user.id,
                displayName:
                    guild.members.cache.get(
                        user.id,
                    )?.displayName ??
                    user.globalName ??
                    user.username,
            }));

        const mentionedUserIds =
            mentionedUsers.map(
                user => user.id,
            );

        const repliedTo =
            referencedMessage
                ? {
                    id:
                    referencedMessage.author.id,
                    displayName:
                        referencedMessage.member
                            ?.displayName ??
                        referencedMessage.author
                            .globalName ??
                        referencedMessage.author
                            .username ??
                        referencedMessage.author
                            .id,
                }
                : undefined;

        const recentMessages =
            await loadRecentMessages(
                message,
            );

        const availableCommands =
            message.member
                ? getAvailableCommandsPrompt(
                    message.member,
                )
                : "";

        const canModerateUser =
            message.member
                ? canModerate(
                    message.member,
                )
                : false;

        const command =
            await recognizeCommand(
                question,
                {
                    mentionedUserIds,
                    repliedTo,
                    recentMessages,
                },
            );

        if (
            command?.intent === "execute"
        ) {
            const member =
                message.member;

            if (!member) {
                return;
            }

            if (!canModerateUser) {
                await message.channel.send(
                    "У тебя нет прав на модераторские команды.",
                );

                return;
            }

            if (
                command.action === "mention"
            ) {
                const target =
                    await resolveTargetMember(
                        guild,
                        command.targetUserId,
                        command.targetQuery ?? null,
                    );

                if (
                    !target.member &&
                    target.ambiguous.length
                ) {
                    const names =
                        target.ambiguous
                            .slice(0, 5)
                            .map(
                                member =>
                                    `• ${member.displayName} (<@${member.id}>)`,
                            )
                            .join("\n");

                    await message.channel.send({
                        content:
                            `Нашёл несколько подходящих участников:\n${names}\nУточни, кого именно ты имеешь в виду.`,
                        allowedMentions: {
                            parse: [],
                        },
                    });

                    return;
                }

                if (!target.member) {
                    await message.channel.send(
                        "Не понял, кого именно ты имеешь в виду.",
                    );

                    return;
                }

                await message.channel.send({
                    content:
                        `<@${target.member.id}>`,
                    allowedMentions: {
                        users: [
                            target.member.id,
                        ],
                    },
                });

                return;
            }

            if (
                CONFIRMATION_REQUIRED.has(
                    command.action,
                )
            ) {
                const target =
                    await resolveTargetMember(
                        guild,
                        command.targetUserId,
                        command.targetQuery ?? null,
                    );

                if (
                    !target.member &&
                    target.ambiguous.length
                ) {
                    const names =
                        target.ambiguous
                            .slice(0, 5)
                            .map(
                                member =>
                                    `• ${member.displayName} (<@${member.id}>)`,
                            )
                            .join("\n");

                    await message.channel.send({
                        content:
                            `Нашёл несколько подходящих участников:\n${names}\nУточни, кого именно ты имеешь в виду.`,
                        allowedMentions: {
                            parse: [],
                        },
                    });

                    return;
                }

                if (!target.member) {
                    await message.channel.send(
                        "Не понял, кого именно ты имеешь в виду.",
                    );

                    return;
                }

                command.targetUserId =
                    target.member.id;

                setPendingCommand({
                    guildId:
                    guild.id,
                    channelId:
                    message.channelId,
                    requesterId:
                    message.author.id,
                    command,
                    targetUserId:
                    target.member.id,
                    targetDisplayName:
                    target.member.displayName,
                    createdAt:
                        Date.now(),
                });

                await message.channel.send({
                    content:
                        buildConfirmationMessage(
                            command,
                            target.member.displayName,
                        ),
                    allowedMentions: {
                        parse: [],
                    },
                });

                return;
            }
        }

        const answer =
            await askAI(
                question,
                {
                    guildId: guild.id,
                    channelId: message.channelId,
                    channelName:
                        (
                            "name" in
                            message.channel
                                ? message.channel.name
                                : message.channelId
                        ),
                    userId:
                    message.author.id,
                    displayName,
                    mentionedUsers,
                    availableCommands,
                    repliedTo,
                    canModerate:
                    canModerateUser,
                },
            );

        if (!answer) {
            await message.reply(
                "Гост завис. Повтори запрос.",
            );

            return;
        }

        const chunks =
            answer.match(
                /[\s\S]{1,1900}/g,
            ) ?? [];

        for (
            const chunk of chunks
            ) {
            await message.channel.send({
                content: chunk,
                allowedMentions: {
                    parse: [],
                },
            });
        }
    } catch (error) {
        console.error(
            "[MESSAGE_CREATE] Failed:",
            error,
        );

        await message.reply(
            "Гост завис. Повтори запрос.",
        );
    }
}

async function loadRecentMessages(
    message: Message,
): Promise<string> {
    const messages =
        await message.channel.messages
            .fetch({
                limit: 30,
            })
            .catch(() => null);

    if (!messages) {
        return "";
    }

    return [...messages.values()]
        .reverse()
        .filter(
            item =>
                !item.author.bot &&
                item.content.trim(),
        )
        .map(item => {
            const member =
                message.guild?.members.cache.get(
                    item.author.id,
                );

            const name =
                member?.displayName ??
                item.author.globalName ??
                item.author.username ??
                item.author.id;

            return (
                `${name} [${item.author.id}]: ` +
                item.content
            );
        })
        .join("\n");
}

function isConfirmation(
    value: string,
): boolean {
    return /^(да|подтверждаю|подтвердить|подтверждаю команду)$/iu.test(
        value.trim(),
    );
}

function isCancellation(
    value: string,
): boolean {
    return /^(нет|отмена|отменить|неа)$/iu.test(
        value.trim(),
    );
}

function buildConfirmationMessage(
    command: ParsedCommand,
    targetName: string,
): string {
    switch (command.action) {
        case "ban":
            return (
                `Забанить **${targetName}**` +
                (
                    command.reason
                        ? ` за "${command.reason}"`
                        : ""
                ) +
                `? Подтверди: **да** или **нет**.`
            );

        case "kick":
            return (
                `Кикнуть **${targetName}**` +
                (
                    command.reason
                        ? ` за "${command.reason}"`
                        : ""
                ) +
                `? Подтверди: **да** или **нет**.`
            );

        case "timeout":
            return (
                `Замутить **${targetName}** ` +
                `на ${formatConfirmationDuration(
                    command.durationMs,
                )}? ` +
                `Подтверди: **да** или **нет**.`
            );

        case "untimeout":
            return (
                `Снять тайм-аут с **${targetName}**? ` +
                `Подтверди: **да** или **нет**.`
            );

        case "warn":
            return (
                `Выдать **${targetName}** ` +
                `предупреждение` +
                (
                    command.reason
                        ? ` за "${command.reason}"`
                        : ""
                ) +
                `? Подтверди: **да** или **нет**.`
            );

        case "add_role":
            return (
                `Выдать **${targetName}** ` +
                `роль **${command.roleName}**? ` +
                `Подтверди: **да** или **нет**.`
            );

        case "remove_role":
            return (
                `Снять с **${targetName}** ` +
                `роль **${command.roleName}**? ` +
                `Подтверди: **да** или **нет**.`
            );

        case "nickname":
            return (
                `Поставить **${targetName}** ` +
                `ник **${command.nickname}**? ` +
                `Подтверди: **да** или **нет**.`
            );

        case "mute_voice":
            return (
                `Замутить **${targetName}** ` +
                `в голосовом канале? ` +
                `Подтверди: **да** или **нет**.`
            );

        case "unban":
            return (
                `Разбанить **${targetName}**? ` +
                `Подтверди: **да** или **нет**.`
            );

        default:
            return (
                `Выполнить действие над ` +
                `**${targetName}**? ` +
                `Подтверди: **да** или **нет**.`
            );
    }
}

function formatConfirmationDuration(
    milliseconds?: number,
): string {
    if (!milliseconds) {
        return "указанное время";
    }

    const minutes =
        Math.floor(
            milliseconds / 60000,
        );

    if (minutes > 0) {
        return `${minutes} мин.`;
    }

    const seconds =
        Math.floor(
            milliseconds / 1000,
        );

    return `${seconds} сек.`;
}