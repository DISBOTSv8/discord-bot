import {
    REST,
    Routes,
    SlashCommandBuilder,
} from "discord.js";

import { client } from "./client";
import {
    DISCORD_TOKEN,
    GUILD_ID,
} from "./config";

import { notifyNewCommands } from "./services/notifyNewCommands";

export const commandDefinitions = [
    {
        builder: new SlashCommandBuilder()
            .setName("ping")
            .setDescription(
                "Check whether the bot is responsive.",
            )
            .setDescriptionLocalizations({
                ru: "Проверить, отвечает ли бот.",
            }),

        news: {
            name: "пинг",
            description: "Проверить, отвечает ли бот.",
        },
    },

    {
        builder: new SlashCommandBuilder()
            .setName("help")
            .setDescription(
                "Show the commands this bot supports.",
            )
            .setDescriptionLocalizations({
                ru: "Показать список доступных команд.",
            }),

        news: {
            name: "помощь",
            description: "Показать список доступных команд.",
        },
    },

    {
        builder: new SlashCommandBuilder()
            .setName("joke")
            .setNameLocalizations({
                ru: "шутка",
            })
            .setDescription("Tell a joke")
            .setDescriptionLocalizations({
                ru: "Рассказать шутку.",
            }),

        news: {
            name: "шутка",
            description: "Рассказать шутку.",
        },
    },

    {
        builder: new SlashCommandBuilder()
            .setName("stats")
            .setNameLocalizations({
                ru: "статистика",
            })
            .setDescription("Show your statistics")
            .setDescriptionLocalizations({
                ru: "Показать свою статистику.",
            }),

        news: {
            name: "статистика",
            description: "Показать свою статистику.",
        },
    },

    {
        builder: new SlashCommandBuilder()
            .setName("update_nickname")
            .setNameLocalizations({
                ru: "обновить_ник",
            })
            .setDescription("Update nickname")
            .setDescriptionLocalizations({
                ru: "Обновить никнейм.",
            })
            .addStringOption((option) =>
                option
                    .setName("nickname")
                    .setNameLocalizations({
                        ru: "никнейм",
                    })
                    .setDescription(
                        "The new nickname you want to set",
                    )
                    .setDescriptionLocalizations({
                        ru: "Новый никнейм.",
                    })
                    .setRequired(true),
            ),

        news: {
            name: "обновить_ник",
            description: "Обновить никнейм.",
        },
    },

    {
        builder: new SlashCommandBuilder()
            .setName("set_nickname")
            .setNameLocalizations({
                ru: "указать_ник",
            })
            .setDescription("Set nickname")
            .setDescriptionLocalizations({
                ru: "Установить игровой ник.",
            })
            .addStringOption((option) =>
                option
                    .setName("nickname")
                    .setNameLocalizations({
                        ru: "никнейм",
                    })
                    .setDescription(
                        "The nickname you want to set",
                    )
                    .setDescriptionLocalizations({
                        ru: "Укажи свой игровой никнейм.",
                    })
                    .setRequired(true),
            ),

        news: {
            name: "указать_ник",
            description:
                "Установить игровой ник.",
        },

    },
];

const commands = commandDefinitions.map(
    ({ builder }) => builder.toJSON(),
);

export async function registerCommands(): Promise<void> {
    if (!client.application) {
        throw new Error(
            "Discord application is not ready.",
        );
    }

    const rest = new REST({
        version: "10",
    }).setToken(DISCORD_TOKEN);

    const applicationId =
        client.application.id;

    if (GUILD_ID) {
        await rest.put(
            Routes.applicationGuildCommands(
                applicationId,
                GUILD_ID,
            ),
            {
                body: commands,
            },
        );

        console.info(
            `Registered ${commands.length} guild commands.`,
        );
    } else {
        await rest.put(
            Routes.applicationCommands(
                applicationId,
            ),
            {
                body: commands,
            },
        );

        console.info(
            `Registered ${commands.length} global commands.`,
        );
    }

    await notifyNewCommands(
        commandDefinitions.map(
            ({ news }) => news,
        ),
    );
}