import {
    ChatInputCommandInteraction,
} from "discord.js";

export async function handleStats(
    interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> {
    await interaction.reply({
        content:
            "📊 Система статистики пока находится в разработке.",
        ephemeral: true,
    });
}