import {
    ChatInputCommandInteraction,
} from "discord.js";

import {
    LOG_CHANNEL,
    NICKNAME_CHANNEL,
    NOT_VERIFIED_USER_ROLE,
    VERIFIED_USER_ROLE,
} from "../config";

import {
    sendMessageToChannel,
} from "../utils/sendMessageToChannel";

export async function handleSetNickname(
    interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> {
    const nickname = interaction.options.getString(
        "nickname",
        true,
    );

    const member = interaction.member;

    if (
        member.roles.cache.has(
            VERIFIED_USER_ROLE,
        )
    ) {
        await interaction.reply({
            content:
                "С данной ролью нельзя установить ник. " +
                "Используй команду `/обновить_ник`.",
            ephemeral: true,
        });

        return;
    }

    try {
        await member.roles.remove(
            NOT_VERIFIED_USER_ROLE,
        );

        await member.roles.add(
            VERIFIED_USER_ROLE,
        );

        await member.setNickname(nickname);
    } catch (error) {
        console.error(
            "[SET NICKNAME] Failed:",
            error,
        );

        await interaction.reply({
            content:
                "Не удалось установить ник. " +
                "Проверь права бота.",
            ephemeral: true,
        });

        return;
    }

    await interaction.reply({
        content:
            `Ник ${nickname} успешно установлен.`,
        ephemeral: true,
    });

    const message =
        `<@${member.id}> указал ник: ${nickname}`;

    await sendMessageToChannel(
        NICKNAME_CHANNEL,
        message,
    );

    await sendMessageToChannel(
        LOG_CHANNEL,
        message,
    );
}