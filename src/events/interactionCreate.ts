import {
    Interaction,
} from "discord.js";

import {
    handleCommand,
} from "../handlers/commandHandler";

import {
    sendMessageToChannel,
} from "../utils/sendMessageToChannel";

import {
    LOG_CHANNEL,
} from "../config";

export async function handleInteractionCreate(
    interaction: Interaction,
): Promise<void> {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (!interaction.inCachedGuild()) {
        await interaction.reply({
            content:
                "❌ Эта команда доступна только на сервере.",
            ephemeral: true,
        });

        return;
    }

    try {
        await sendMessageToChannel(
            LOG_CHANNEL,
            [
                `📋 **Команда:** \`/${interaction.commandName}\``,
                `👤 **Пользователь:** <@${interaction.user.id}>`,
                `📌 **Канал:** <#${interaction.channelId}>`,
                `🕐 **Время:** <t:${Math.floor(Date.now() / 1000)}:F>`,
            ].join("\n"),
        );

        await handleCommand(
            interaction,
            interaction.client,
        );
    } catch (error) {
        console.error(
            `[COMMAND] ${interaction.commandName} failed:`,
            error,
        );

        const errorMessage =
            "❌ Произошла ошибка при выполнении команды.";

        try {
            if (
                interaction.replied ||
                interaction.deferred
            ) {
                await interaction.followUp({
                    content: errorMessage,
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: errorMessage,
                    ephemeral: true,
                });
            }
        } catch (replyError) {
            console.error(
                "[COMMAND] Failed to send error response:",
                replyError,
            );
        }
    }
}