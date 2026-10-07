import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
} from "discord.js";
import {TEST_CHANNEL} from "../config";


const BUTTON_PREFIX = "test:";

export const TEST_BUTTONS = {
    MEMBER_JOIN: `${BUTTON_PREFIX}member_join`,
    ADD_ROLE: `${BUTTON_PREFIX}add_role`,
    REMOVE_ROLE: `${BUTTON_PREFIX}remove_role`,
    NICKNAME: `${BUTTON_PREFIX}nickname`,
    MEMBER_LEAVE: `${BUTTON_PREFIX}member_leave`,
    AI_WELCOME: `${BUTTON_PREFIX}ai_welcome`,
    FULL_TEST: `${BUTTON_PREFIX}full_test`,
} as const;

export function isTestButton(
    customId: string,
): boolean {
    return customId.startsWith(
        BUTTON_PREFIX,
    );
}

export function createTestPanel(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("🧪 Тестовая панель бота")
        .setDescription(
            [
                "Здесь можно вручную запускать Discord-события.",
                "",
                "Кнопки не требуют реального события Discord.",
                "Для теста используется пользователь, который нажал кнопку.",
                "",
                "⚠️ Некоторые тесты могут менять роли или nickname.",
            ].join("\n"),
        );
}

export function createTestButtons():
    ActionRowBuilder<ButtonBuilder>[] {
    const row1 =
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        TEST_BUTTONS.MEMBER_JOIN,
                    )
                    .setLabel("Member Join")
                    .setEmoji("👋")
                    .setStyle(
                        ButtonStyle.Primary,
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TEST_BUTTONS.ADD_ROLE,
                    )
                    .setLabel("Add Role")
                    .setEmoji("➕")
                    .setStyle(
                        ButtonStyle.Success,
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TEST_BUTTONS.REMOVE_ROLE,
                    )
                    .setLabel("Remove Role")
                    .setEmoji("➖")
                    .setStyle(
                        ButtonStyle.Danger,
                    ),
            );

    const row2 =
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        TEST_BUTTONS.NICKNAME,
                    )
                    .setLabel("Nickname")
                    .setEmoji("📝")
                    .setStyle(
                        ButtonStyle.Secondary,
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TEST_BUTTONS.MEMBER_LEAVE,
                    )
                    .setLabel("Member Leave")
                    .setEmoji("🚪")
                    .setStyle(
                        ButtonStyle.Danger,
                    ),

                new ButtonBuilder()
                    .setCustomId(
                        TEST_BUTTONS.AI_WELCOME,
                    )
                    .setLabel("AI Welcome")
                    .setEmoji("🤖")
                    .setStyle(
                        ButtonStyle.Primary,
                    ),
            );

    const row3 =
        new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(
                        TEST_BUTTONS.FULL_TEST,
                    )
                    .setLabel("FULL TEST")
                    .setEmoji("🧪")
                    .setStyle(
                        ButtonStyle.Success,
                    ),
            );

    return [
        row1,
        row2,
        row3,
    ];
}

export async function sendTestPanel(
    interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> {
    if (
        interaction.channelId !==
        TEST_CHANNEL
    ) {
        await interaction.reply({
            content:
                "❌ Эта команда доступна только в тестовом канале.",
            ephemeral: true,
        });

        return;
    }

    await interaction.reply({
        embeds: [
            createTestPanel(),
        ],
        components:
            createTestButtons(),
    });
}