import {
    ChatInputCommandInteraction,
} from "discord.js";

import {
    LOG_CHANNEL,
    NICKNAME_CHANNEL,
    NOT_VERIFIED_USER_ROLE,
} from "../config";

import {
    sendMessageToChannel,
} from "../utils/sendMessageToChannel";

export async function handleUpdateNickname(
    interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> {
    const nickname = interaction.options.getString(
        "nickname",
        true,
    );

    const member = interaction.member;

    if (
        member.roles.cache.has(
            NOT_VERIFIED_USER_ROLE,
        )
    ) {
        await interaction.reply({
            content:
                "С данной ролью нельзя обновить ник. " +
                "Используй команду `/указать_ник`.",
            ephemeral: true,
        });

        return;
    }

    try {
        await member.setNickname(nickname);
    } catch (error) {
        console.error(
            "[UPDATE NICKNAME] Failed to change nickname:",
            error,
        );

        await interaction.reply({
            content:
                "Не удалось изменить ник. " +
                "У бота нет необходимых прав.",
            ephemeral: true,
        });

        return;
    }

    await interaction.reply({
        content: "Ник успешно изменён.",
        ephemeral: true,
    });

    const message =
        `<@${member.id}> изменил ник: ${nickname}`;

    await sendMessageToChannel(
        NICKNAME_CHANNEL,
        `${message}\n-------------------------`,
    );

    await sendMessageToChannel(
        LOG_CHANNEL,
        message,
    );
}