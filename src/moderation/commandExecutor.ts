import {
    GuildMember,
    Role,
} from "discord.js";

import {
    canModerate,
} from "./moderationPermissions";

import {
    ParsedCommand,
} from "./moderationTypes";

export async function executeModerationCommand(
    member: GuildMember,
    command: ParsedCommand,
): Promise<string> {
    if (!canModerate(member)) {
        return "⛔ У тебя нет прав на выполнение модерационных команд.";
    }

    if (command.intent !== "execute") {
        return "❌ Эта команда не предназначена для выполнения действия.";
    }

    if (command.action === "mention") {
        if (!command.targetUserId) {
            return "❌ Не указан пользователь.";
        }

        return `<@${command.targetUserId}>`;
    }

    if (!command.targetUserId) {
        return "❌ Не указан пользователь.";
    }

    let target: GuildMember | null = null;

    try {
        target =
            await member.guild.members.fetch(
                command.targetUserId,
            );
    } catch {
        return "❌ Пользователь не найден.";
    }

    if (!target) {
        return "❌ Пользователь не найден.";
    }

    if (target.id === member.id) {
        return "❌ Нельзя выполнить это действие над собой.";
    }

    if (target.id === member.guild.ownerId) {
        return "❌ Нельзя выполнить это действие над владельцем сервера.";
    }

    switch (command.action) {
        case "timeout": {
            if (!command.durationMs) {
                return "❌ Не указана длительность мута.";
            }

            const maxDuration =
                28 * 24 * 60 * 60 * 1000;

            if (
                command.durationMs >
                maxDuration
            ) {
                return "❌ Максимальная длительность мута — 28 дней.";
            }

            if (!target.moderatable) {
                return "❌ Я не могу замутить этого пользователя.";
            }

            await target.timeout(
                command.durationMs,
                command.reason ??
                "Ghost moderation",
            );

            const duration =
                formatDuration(
                    command.durationMs,
                );

            return formatResult(
                command,
                `🔇 ${target} получил мут на ${duration}.`,
            );
        }

        case "untimeout": {
            if (!target.moderatable) {
                return "❌ Я не могу снять мут с этого пользователя.";
            }

            await target.timeout(
                null,
                command.reason ??
                "Ghost moderation",
            );

            return formatResult(
                command,
                `🔊 С ${target} снят мут.`,
            );
        }

        case "kick": {
            if (!target.kickable) {
                return "❌ Я не могу кикнуть этого пользователя.";
            }

            await target.kick(
                command.reason ??
                "Ghost moderation",
            );

            return formatResult(
                command,
                `👢 ${target.user.tag} исключён с сервера.`,
            );
        }

        case "ban": {
            if (!target.bannable) {
                return "❌ Я не могу забанить этого пользователя.";
            }

            await target.ban({
                reason:
                    command.reason ??
                    "Ghost moderation",
            });

            return formatResult(
                command,
                `🔨 ${target.user.tag} заблокирован.`,
            );
        }

        case "unban": {
            const bans =
                await member.guild.bans.fetch();

            const bannedUser =
                bans.get(
                    command.targetUserId,
                );

            if (!bannedUser) {
                return "❌ Пользователь не найден в списке банов.";
            }

            await member.guild.members.unban(
                command.targetUserId,
                command.reason ??
                "Ghost moderation",
            );

            return formatResult(
                command,
                `🔓 С пользователя **${bannedUser.user.tag}** снят бан.`,
            );
        }

        case "warn": {
            return formatResult(
                command,
                `⚠️ ${target} получил предупреждение${
                    command.reason
                        ? `: ${command.reason}`
                        : "."
                }`,
            );
        }

        case "add_role": {
            if (!command.roleName) {
                return "❌ Не указано название роли.";
            }

            const role =
                findRoleByName(
                    member,
                    command.roleName,
                );

            if (!role) {
                return `❌ Роль **${command.roleName}** не найдена.`;
            }

            if (!role.editable) {
                return "❌ Я не могу выдать эту роль.";
            }

            await target.roles.add(
                role,
                command.reason ??
                "Ghost moderation",
            );

            return formatResult(
                command,
                `➕ ${target} получил роль **${role.name}**.`,
            );
        }

        case "remove_role": {
            if (!command.roleName) {
                return "❌ Не указано название роли.";
            }

            const role =
                findRoleByName(
                    member,
                    command.roleName,
                );

            if (!role) {
                return `❌ Роль **${command.roleName}** не найдена.`;
            }

            if (!role.editable) {
                return "❌ Я не могу снять эту роль.";
            }

            await target.roles.remove(
                role,
                command.reason ??
                "Ghost moderation",
            );

            return formatResult(
                command,
                `➖ У ${target} забрана роль **${role.name}**.`,
            );
        }

        case "nickname": {
            if (!command.nickname) {
                return "❌ Не указан новый ник.";
            }

            if (!target.manageable) {
                return "❌ Я не могу изменить ник этого пользователя.";
            }

            await target.setNickname(
                command.nickname,
                command.reason ??
                "Ghost moderation",
            );

            return formatResult(
                command,
                `📝 Ник ${target} изменён на **${command.nickname}**.`,
            );
        }

        case "mute_voice": {
            if (!target.voice.channel) {
                return "❌ Пользователь сейчас не находится в голосовом канале.";
            }

            if (!target.moderatable) {
                return "❌ Я не могу выключить микрофон этому пользователю.";
            }

            await target.voice.setMute(
                true,
                command.reason ??
                "Ghost moderation",
            );

            return formatResult(
                command,
                `🔇 ${target} получил мут в голосовом канале.`,
            );
        }

        default:
            return "❌ Неизвестная команда.";
    }
}

function findRoleByName(
    member: GuildMember,
    roleName: string,
): Role | null {
    const normalized =
        roleName
            .trim()
            .toLowerCase();

    return (
        member.guild.roles.cache.find(
            (role) =>
                role.name
                    .trim()
                    .toLowerCase() ===
                normalized,
        ) ?? null
    );
}

function formatResult(
    command: ParsedCommand,
    message: string,
): string {
    if (
        command.mentionTarget &&
        command.targetUserId
    ) {
        return `<@${command.targetUserId}> ${message}`;
    }

    return message;
}

function formatDuration(
    milliseconds: number,
): string {
    const minutes =
        Math.floor(
            milliseconds / 60_000,
        );

    if (minutes < 60) {
        return `${minutes} мин.`;
    }

    const hours =
        Math.floor(
            minutes / 60,
        );

    if (hours < 24) {
        return `${hours} ч.`;
    }

    const days =
        Math.floor(
            hours / 24,
        );

    return `${days} д.`;
}