// src/initialization/initializeBot.ts

import { Client } from "discord.js";

import { getServerRoles } from "../config/serverRoles";
import { getServerChannels } from "../config/serverChannels";
import { syncExistingMembers } from "../services/syncExistingMembers";
import { registerCommands } from "../commands";
import {loadGuildHistory} from "../services/loadGuildHistory";

export async function initializeBot(
    client: Client<true>,
): Promise<void> {
    console.info(
        `Logged in as ${client.user.tag}.`,
    );

    try {
        // await initDb();

        const serverRoles = getServerRoles();
        const serverChannels = getServerChannels();

        console.info("roles", serverRoles);
        console.info("channels", serverChannels);

        await loadGuildHistory(client);
        await syncExistingMembers();
        await registerCommands();
    } catch (error) {
        console.error(
            "Failed to initialize bot.",
            error,
        );

        // await closeDb();

        await client.destroy();

        process.exitCode = 1;
    }
}