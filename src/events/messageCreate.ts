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
    getAvailableCommandsPrompt,
} from "../moderation/commandCatalog";

import {
    recognizeCommand,
} from "../moderation/recognizeCommand";

import {
    executeModerationCommand,
} from "../moderation/executeModerationCommand";

import {
    askAI,
} from "../ai/askAI";

const GHOST_TRIGGER_REGEX =
    /^(ghost|гост)(?:\s+|(?=[,!.?:;]|$))/iu;

export async function handleMessageCreate(
    message: Message,
): Promise<void> {
    if (
        message.author.bot ||
        !message.guild
    ) {
        return;
    }

    const guild = message.guild;

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
        guildId: message.guildId!,
        channelId: message.channelId,
        channelName:
            ("name" in message.channel
                ? message.channel.name
                : null) ?? message.channelId,
        userId: message.author.id,
        displayName,
        content: message.content,
        timestamp: message.createdTimestamp,
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

    const botUser = client.user;

    if (!botUser) {
        return;
    }

    const isMention =
        message.mentions.has(botUser);

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

    if (!message.channel.isSendable()) {
        return;
    }

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
                    id: referencedMessage.author.id,
                    displayName:
                        referencedMessage.member
                            ?.displayName ??
                        referencedMessage.author.displayName,
                }
                : undefined;

        const availableCommands =
            message.member
                ? getAvailableCommandsPrompt(
                    message.member,
                )
                : "";

        const command =
            await recognizeCommand(
                question,
                mentionedUserIds,
            );

        if (
            command?.intent ===
            "execute"
        ) {
            const result =
                await executeModerationCommand(
                    command,
                    message,
                );

            if (result) {
                await message.channel.send({
                    content: result,
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
                        "name" in message.channel
                            ? message.channel.name
                            : message.channelId,
                    userId: message.author.id,
                    displayName,
                    mentionedUsers,
                    availableCommands,
                    repliedTo,
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

        for (const chunk of chunks) {
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