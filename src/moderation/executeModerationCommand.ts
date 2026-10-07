import {
    Message,
} from "discord.js";

import {
    ParsedCommand,
} from "./moderationTypes";

export async function executeModerationCommand(
    command: ParsedCommand,
    message: Message,
): Promise<string> {
    if (!message.guild) {
        return "Сервер не найден.";
    }

    const targetId =
        command.targetUserId;

    if (!targetId) {
        return "Не удалось определить участника.";
    }

    const member =
        await message.guild.members
            .fetch(targetId)
            .catch(() => null);

    if (!member) {
        return "Участник не найден.";
    }

    const me =
        message.guild.members.me;

    if (!me) {
        return "Не удалось получить участника Госта.";
    }

    switch (command.action) {
        case "warn":
            return `Предупреждение выдано ${member.displayName}.`;

        case "timeout": {
            if (!command.durationMs) {
                return "Не указано время тайм-аута.";
            }

            if (
                !member.moderatable
            ) {
                return "Я не могу ограничить этого участника.";
            }

            await member.timeout(
                command.durationMs,
                command.reason ??
                "Команда Госта",
            );

            return `Тайм-аут для ${member.displayName} установлен на ${formatDuration(command.durationMs)}.`;
        }

        case "untimeout": {
            if (
                !member.moderatable
            ) {
                return "Я не могу снять тайм-аут с этого участника.";
            }

            await member.timeout(
                null,
                command.reason ??
                "Команда Госта",
            );

            return `Тайм-аут с ${member.displayName} снят.`;
        }

        case "kick": {
            if (
                !member.kickable
            ) {
                return "Я не могу кикнуть этого участника.";
            }

            await member.kick(
                command.reason ??
                "Команда Госта",
            );

            return `${member.displayName} исключён с сервера.`;
        }

        case "ban": {
            if (
                !member.bannable
            ) {
                return "Я не могу забанить этого участника.";
            }

            await member.ban({
                reason:
                    command.reason ??
                    "Команда Госта",
            });

            return `${member.displayName} забанен.`;
        }

        case "unban": {
            await message.guild.members.unban(
                targetId,
                command.reason ??
                "Команда Госта",
            );

            return `Пользователь ${targetId} разбанен.`;
        }

        case "add_role": {
            if (!command.roleName) {
                return "Не указана роль.";
            }

            const role =
                message.guild.roles.cache.find(
                    item =>
                        item.name
                            .toLowerCase() ===
                        command.roleName!
                            .toLowerCase(),
                );

            if (!role) {
                return `Роль "${command.roleName}" не найдена.`;
            }

            if (
                role.position >=
                me.roles.highest.position
            ) {
                return "Я не могу выдать эту роль.";
            }

            await member.roles.add(
                role,
                command.reason ??
                "Команда Госта",
            );

            return `Роль ${role.name} выдана ${member.displayName}.`;
        }

        case "remove_role": {
            if (!command.roleName) {
                return "Не указана роль.";
            }

            const role =
                message.guild.roles.cache.find(
                    item =>
                        item.name
                            .toLowerCase() ===
                        command.roleName!
                            .toLowerCase(),
                );

            if (!role) {
                return `Роль "${command.roleName}" не найдена.`;
            }

            if (
                role.position >=
                me.roles.highest.position
            ) {
                return "Я не могу снять эту роль.";
            }

            await member.roles.remove(
                role,
                command.reason ??
                "Команда Госта",
            );

            return `Роль ${role.name} снята с ${member.displayName}.`;
        }

        case "nickname": {
            if (!command.nickname) {
                return "Не указан новый ник.";
            }

            if (
                !member.manageable
            ) {
                return "Я не могу изменить ник этого участника.";
            }

            await member.setNickname(
                command.nickname,
                command.reason ??
                "Команда Госта",
            );

            return `Ник ${member.displayName} изменён на ${command.nickname}.`;
        }

        case "mention": {
            return `<@${member.id}>`;
        }

        case "mute_voice": {
            if (
                !member.voice.channel
            ) {
                return `${member.displayName} сейчас не находится в голосовом канале.`;
            }

            if (
                !member.voice.serverMute
            ) {
                await member.voice.setMute(
                    true,
                    command.reason ??
                    "Команда Госта",
                );
            }

            return `${member.displayName} заглушён в голосовом канале.`;
        }

        default:
            return "Неизвестная команда.";
    }
}

function formatDuration(
    milliseconds: number,
): string {
    const totalSeconds =
        Math.floor(
            milliseconds / 1000,
        );

    const minutes =
        Math.floor(
            totalSeconds / 60,
        );

    const seconds =
        totalSeconds % 60;

    if (
        minutes > 0 &&
        seconds > 0
    ) {
        return `${minutes} мин. ${seconds} сек.`;
    }

    if (minutes > 0) {
        return `${minutes} мин.`;
    }

    return `${seconds} сек.`;
}