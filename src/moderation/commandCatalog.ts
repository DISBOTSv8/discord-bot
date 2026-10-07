import {
    GuildMember,
} from "discord.js";

import {
    MODERATION_ROLE_IDS,
} from "../config/moderationRoles";

interface CommandInfo {
    name: string;
    description: string;
    moderation?: boolean;
}

const COMMANDS: CommandInfo[] = [
    {
        name: "/ping",
        description: "Проверить, работает ли бот.",
    },
    {
        name: "/help",
        description: "Показать доступные команды.",
    },
    {
        name: "/обновить_ник",
        description: "Обновить свой ник.",
    },
    {
        name: "/указать_ник",
        description: "Указать свой ник.",
    },
    {
        name: "/joke",
        description: "Получить шутку.",
    },
    {
        name: "warn",
        description: "Выдать предупреждение участнику.",
        moderation: true,
    },
    {
        name: "timeout",
        description: "Выдать тайм-аут участнику.",
        moderation: true,
    },
    {
        name: "untimeout",
        description: "Снять тайм-аут с участника.",
        moderation: true,
    },
    {
        name: "kick",
        description: "Кикнуть участника.",
        moderation: true,
    },
    {
        name: "ban",
        description: "Забанить участника.",
        moderation: true,
    },
    {
        name: "unban",
        description: "Разбанить участника.",
        moderation: true,
    },
    {
        name: "add_role",
        description: "Выдать участнику роль.",
        moderation: true,
    },
    {
        name: "remove_role",
        description: "Снять с участника роль.",
        moderation: true,
    },
    {
        name: "nickname",
        description: "Изменить ник участника.",
        moderation: true,
    },
    {
        name: "mention",
        description: "Упомянуть участника.",
        moderation: true,
    },
    {
        name: "mute_voice",
        description: "Замутить участника в голосовом канале.",
        moderation: true,
    },
];

export function getAvailableCommandsPrompt(
    member: GuildMember,
): string {
    const isModerator =
        member.roles.cache.some(
            role =>
                MODERATION_ROLE_IDS.includes(
                    role.id,
                ),
        );

    const availableCommands =
        COMMANDS.filter(
            command =>
                !command.moderation ||
                isModerator,
        );

    if (!availableCommands.length) {
        return "Доступных команд нет.";
    }

    return availableCommands
        .map(
            command =>
                `${command.name} — ${command.description}`,
        )
        .join("\n");
}

export function getAllCommands(): CommandInfo[] {
    return COMMANDS;
}