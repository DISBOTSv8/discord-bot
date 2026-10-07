import { Client } from "discord.js";

import { initializeBot } from "../initialization/initializeBot";

import { handleGuildMemberAdd } from "./guildMemberAdd";
import { handleGuildMemberRemove } from "./guildMemberRemove";
import { guildMemberUpdate } from "./guildMemberUpdate";
import { handleInteractionCreate } from "./interactionCreate";
import { handleMessageCreate } from "./messageCreate";

export function registerEvents(
    client: Client,
): void {
    client.once(
        "clientReady",
        async (readyClient) => {
            try {
                await initializeBot(
                    readyClient,
                );
            } catch (error) {
                console.error(
                    "[CLIENT_READY] Failed to initialize bot:",
                    error,
                );

                await readyClient.destroy();

                process.exitCode = 1;
            }
        },
    );

    client.on(
        "guildMemberAdd",
        handleGuildMemberAdd,
    );

    client.on(
        "guildMemberRemove",
        handleGuildMemberRemove,
    );

    client.on(
        "guildMemberUpdate",
        guildMemberUpdate,
    );

    client.on(
        "interactionCreate",
        handleInteractionCreate,
    );

    client.on(
        "messageCreate",
        handleMessageCreate,
    );
}