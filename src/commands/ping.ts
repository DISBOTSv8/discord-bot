import {
    ChatInputCommandInteraction,
    Client,
} from "discord.js";

export async function handlePing(
    interaction: ChatInputCommandInteraction<"cached">,
    client: Client<true>,
): Promise<void> {
    await interaction.reply(
        `🏓 Пинг: ${client.ws.ping}ms.`,
    );
}