import {
    ChatInputCommandInteraction,
    Client,
} from "discord.js";

import { handlePing } from "../commands/ping";
import { handleHelp } from "../commands/help";
import { handleJoke } from "../commands/joke";
import { handleStats } from "../commands/stats";
import { handleSetNickname } from "../commands/setNickname";
import { handleUpdateNickname } from "../commands/updateNickname";

export async function handleCommand(
    interaction: ChatInputCommandInteraction<"cached">,
    client: Client<true>,
): Promise<void> {
    switch (interaction.commandName) {
        case "ping":
            return handlePing(
                interaction,
                client,
            );

        case "help":
            return handleHelp(interaction);

        case "joke":
            return handleJoke(interaction);

        case "stats":
            return handleStats(interaction);

        case "update_nickname":
            return handleUpdateNickname(
                interaction,
            );

        case "set_nickname":
            return handleSetNickname(
                interaction,
            );

        default:
            await interaction.reply({
                content:
                    "❌ Данной команды не существует.",
                ephemeral: true,
            });
    }
}