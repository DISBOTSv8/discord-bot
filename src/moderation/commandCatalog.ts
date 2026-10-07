import {
    GuildMember,
} from "discord.js";

import {
    MODERATION_ROLE_IDS,
} from "../config/moderationRoles";

import {
    ModerationAction,
} from "./moderationTypes";

interface BotCommand {
    action?: ModerationAction;
    name: string;
    description: string;
    examples: string[];
    moderatorOnly: boolean;
}

const COMMANDS: BotCommand[] = [
    {
        name: "Общение",
        description: "Общаться с Гостом на обычные темы.",
        examples: [
            "Гост, как дела?",
            "Гост, посоветуй фильм",
        ],
        moderatorOnly: false,
    },
    {
        name: "Шутка",
        description: "Рассказать шутку.",
        examples: [
            "Гост, расскажи шутку",
        ],
        moderatorOnly: false,
    },
    {
        action: "warn",
        name: "Предупреждение",
        description: "Выдать участнику предупреждение.",
        examples: [
            "Гост, дай варнинг @Игроку",
            "Гост, предупреди @Игрока за спам",
        ],
        moderatorOnly: true,
    },
    {
        action: "timeout",
        name: "Тайм-аут",
        description: "Ограничить возможность писать участнику на время.",
        examples: [
            "Гост, замути @Игрока на 10 минут",
        ],
        moderatorOnly: true,
    },
    {
        action: "untimeout",
        name: "Снять тайм-аут",
        description: "Снять ограничение с участника.",
        examples: [
            "Гост, размуть @Игрока",
        ],
        moderatorOnly: true,
    },
    {
        action: "kick",
        name: "Кик",
        description: "Исключить участника с сервера.",
        examples: [
            "Гост, кикни @Игрока",
        ],
        moderatorOnly: true,
    },
    {
        action: "ban",
        name: "Бан",
        description: "Заблокировать участника на сервере.",
        examples: [
            "Гост, забань @Игрока",
        ],
        moderatorOnly: true,
    },
    {
        action: "unban",
        name: "Разбан",
        description: "Снять бан с пользователя.",
        examples: [
            "Гост, разбань пользователя",
        ],
        moderatorOnly: true,
    },
    {
        action: "add_role",
        name: "Выдать роль",
        description: "Выдать участнику роль.",
        examples: [
            "Гост, выдай @Игроку роль Мемолог",
        ],
        moderatorOnly: true,
    },
    {
        action: "remove_role",
        name: "Снять роль",
        description: "Снять с участника роль.",
        examples: [
            "Гост, сними с @Игрока роль Мемолог",
        ],
        moderatorOnly: true,
    },
    {
        action: "nickname",
        name: "Изменение ника",
        description: "Изменить ник участника.",
        examples: [
            "Гост, поставь @Игроку ник Батя",
        ],
        moderatorOnly: true,
    },
    {
        action: "mention",
        name: "Упоминание",
        description: "Упомянуть участника.",
        examples: [
            "Гост, тегни @Игрока",
        ],
        moderatorOnly: true,
    },
    {
        action: "mute_voice",
        name: "Мут в голосовом канале",
        description: "Выключить микрофон участнику в голосовом канале.",
        examples: [
            "Гост, замути @Игрока в голосе",
        ],
        moderatorOnly: true,
    },
];

export function getAvailableCommands(
    member: GuildMember,
): BotCommand[] {
    const canModerate =
        member.roles.cache.some(
            (role) =>
                MODERATION_ROLE_IDS.includes(
                    role.id,
                ),
        );

    return COMMANDS.filter(
        (command) =>
            !command.moderatorOnly ||
            canModerate,
    );
}

export function getAvailableCommandsPrompt(
    member: GuildMember,
): string {
    const commands =
        getAvailableCommands(member);

    return commands
        .map(
            (command) =>
                [
                    `Команда: ${command.name}`,
                    `Описание: ${command.description}`,
                    `Примеры: ${command.examples.join("; ")}`,
                ].join("\n"),
        )
        .join("\n\n");
}