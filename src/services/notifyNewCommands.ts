import {
    EmbedBuilder,
} from "discord.js";

import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from "node:fs";

import { dirname } from "node:path";

import { client } from "../client";
import { NEWS_CHANNEL } from "../config";

const COMMANDS_FILE =
    "data/commands.json";

interface StoredCommand {
    name: string;
    description: string;
}

function loadStoredCommands(): StoredCommand[] {
    if (!existsSync(COMMANDS_FILE)) {
        mkdirSync(
            dirname(COMMANDS_FILE),
            {
                recursive: true,
            },
        );

        writeFileSync(
            COMMANDS_FILE,
            "[]",
            "utf-8",
        );

        return [];
    }

    const content =
        readFileSync(
            COMMANDS_FILE,
            "utf-8",
        );

    if (!content.trim()) {
        return [];
    }

    return JSON.parse(content);
}

function saveStoredCommands(
    commands: StoredCommand[],
): void {
    mkdirSync(
        dirname(COMMANDS_FILE),
        {
            recursive: true,
        },
    );

    writeFileSync(
        COMMANDS_FILE,
        JSON.stringify(
            commands,
            null,
            4,
        ),
        "utf-8",
    );
}

export async function notifyNewCommands(
    commands: StoredCommand[],
): Promise<void> {
    const storedCommands =
        loadStoredCommands();

    const newCommands =
        commands.filter(
            (command) =>
                !storedCommands.some(
                    (storedCommand) =>
                        storedCommand.name ===
                        command.name,
                ),
        );

    if (!newCommands.length) {
        return;
    }

    const channel =
        await client.channels.fetch(
            NEWS_CHANNEL,
        );

    if (!channel) {
        throw new Error(
            `NEWS_CHANNEL ${NEWS_CHANNEL} not found.`,
        );
    }

    if (!channel.isTextBased()) {
        throw new Error(
            `NEWS_CHANNEL ${NEWS_CHANNEL} is not a text channel.`,
        );
    }

    if (!channel.isSendable()) {
        throw new Error(
            `NEWS_CHANNEL ${NEWS_CHANNEL} is not sendable.`,
        );
    }

    for (const command of newCommands) {
        const embed =
            new EmbedBuilder()
                .setTitle(
                    "🆕 Новая команда",
                )
                .setDescription(
                    "У бота появилась новая команда:",
                )
                .addFields({
                    name: `/${command.name}`,
                    value:
                        command.description ||
                        "Описание отсутствует.",
                })
                .setColor(0x5865f2)
                .setTimestamp();

        await channel.send({
            embeds: [embed],
        });
    }

    saveStoredCommands([
        ...storedCommands,
        ...newCommands,
    ]);

    console.info(
        `Published ${newCommands.length} new command(s).`,
    );
}