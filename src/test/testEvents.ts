import {
    ButtonInteraction,
} from "discord.js";

import {
    NOT_VERIFIED_USER_ROLE,
    LOG_CHANNEL,
    TEST_CHANNEL,
} from "../config";

import {
    sendMessageToChannel,
} from "../utils/sendMessageToChannel";

import {
    createAIWelcomeEmbed,
} from "../services/aiWelcome";

export async function handleTestButton(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    if (
        interaction.channelId !==
        TEST_CHANNEL
    ) {
        await interaction.reply({
            content:
                "❌ Тестовые кнопки работают только в тестовом канале.",
            ephemeral: true,
        });

        return;
    }

    switch (interaction.customId) {
        case "test:member_join":
            await testMemberJoin(
                interaction,
            );
            break;

        case "test:add_role":
            await testAddRole(
                interaction,
            );
            break;

        case "test:remove_role":
            await testRemoveRole(
                interaction,
            );
            break;

        case "test:nickname":
            await testNickname(
                interaction,
            );
            break;

        case "test:member_leave":
            await testMemberLeave(
                interaction,
            );
            break;

        case "test:ai_welcome":
            await testAIWelcome(
                interaction,
            );
            break;

        case "test:full_test":
            await testFull(
                interaction,
            );
            break;

        default:
            await interaction.reply({
                content:
                    "❌ Неизвестная тестовая кнопка.",
                ephemeral: true,
            });
    }
}

/**
 * Имитация guildMemberAdd.
 *
 * Реальный Discord event здесь не вызывается.
 * Мы напрямую выполняем бизнес-логику,
 * которую нужно проверить.
 */
async function testMemberJoin(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    const member =
        interaction.member;

    await interaction.deferReply({
        ephemeral: true,
    });

    try {
        if (
            !member.roles.cache.has(
                NOT_VERIFIED_USER_ROLE,
            )
        ) {
            await member.roles.add(
                NOT_VERIFIED_USER_ROLE,
                "Test: member join",
            );
        }

        const embed =
            await createAIWelcomeEmbed(
                member.id,
            );

        await sendMessageToChannel(
            TEST_CHANNEL,
            {
                embeds: [embed],
            },
        );

        await sendMessageToChannel(
            LOG_CHANNEL,
            `🧪 Тест **Member Join** для <@${member.id}>.`,
        );

        await interaction.editReply(
            "✅ Member Join успешно протестирован.",
        );
    } catch (error) {
        console.error(
            "[TEST] Member Join failed:",
            error,
        );

        await interaction.editReply(
            "❌ Member Join завершился ошибкой.",
        );
    }
}

/**
 * Реально добавляет роль.
 *
 * После этого Discord автоматически вызовет
 * guildMemberUpdate.
 */
async function testAddRole(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    const member =
        interaction.member;

    try {
        if (
            member.roles.cache.has(
                NOT_VERIFIED_USER_ROLE,
            )
        ) {
            await interaction.reply({
                content:
                    "ℹ️ У тебя уже есть NOT_VERIFIED роль.",
                ephemeral: true,
            });

            return;
        }

        await member.roles.add(
            NOT_VERIFIED_USER_ROLE,
            "Test: add role",
        );

        await interaction.reply({
            content:
                "✅ Роль добавлена. Теперь Discord должен вызвать guildMemberUpdate.",
            ephemeral: true,
        });
    } catch (error) {
        console.error(
            "[TEST] Add role failed:",
            error,
        );

        await interaction.reply({
            content:
                "❌ Не удалось добавить роль.",
            ephemeral: true,
        });
    }
}

/**
 * Реально удаляет роль.
 *
 * После этого Discord автоматически вызовет
 * guildMemberUpdate.
 */
async function testRemoveRole(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    const member =
        interaction.member;

    try {
        if (
            !member.roles.cache.has(
                NOT_VERIFIED_USER_ROLE,
            )
        ) {
            await interaction.reply({
                content:
                    "ℹ️ У тебя нет NOT_VERIFIED роли.",
                ephemeral: true,
            });

            return;
        }

        await member.roles.remove(
            NOT_VERIFIED_USER_ROLE,
            "Test: remove role",
        );

        await interaction.reply({
            content:
                "✅ Роль удалена. Теперь Discord должен вызвать guildMemberUpdate.",
            ephemeral: true,
        });
    } catch (error) {
        console.error(
            "[TEST] Remove role failed:",
            error,
        );

        await interaction.reply({
            content:
                "❌ Не удалось удалить роль.",
            ephemeral: true,
        });
    }
}

/**
 * Реально меняет nickname.
 *
 * Discord автоматически вызовет guildMemberUpdate.
 */
async function testNickname(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    const member =
        interaction.member;

    const nickname =
        `TEST_${Date.now()
            .toString()
            .slice(-6)}`;

    try {
        const oldNickname =
            member.nickname;

        await member.setNickname(
            nickname,
            "Test: nickname",
        );

        await interaction.reply({
            content:
                [
                    "✅ Ник изменён.",
                    "",
                    `Было: **${oldNickname ?? "нет ника"}**`,
                    `Стало: **${nickname}**`,
                    "",
                    "Discord должен автоматически вызвать guildMemberUpdate.",
                ].join("\n"),
            ephemeral: true,
        });
    } catch (error) {
        console.error(
            "[TEST] Nickname failed:",
            error,
        );

        await interaction.reply({
            content:
                "❌ Не удалось изменить nickname.",
            ephemeral: true,
        });
    }
}

/**
 * Имитация guildMemberRemove.
 *
 * Пользователя реально не кикаем.
 */
async function testMemberLeave(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    const member =
        interaction.member;

    try {
        await sendMessageToChannel(
            LOG_CHANNEL,
            `🧪 Имитация выхода участника: <@${member.id}>.`,
        );

        await interaction.reply({
            content:
                "✅ Member Leave протестирован. Реальный kick не выполнялся.",
            ephemeral: true,
        });
    } catch (error) {
        console.error(
            "[TEST] Member Leave failed:",
            error,
        );

        await interaction.reply({
            content:
                "❌ Member Leave завершился ошибкой.",
            ephemeral: true,
        });
    }
}

/**
 * Только AI Welcome.
 */
async function testAIWelcome(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    const member =
        interaction.member;

    await interaction.deferReply({
        ephemeral: true,
    });

    try {
        const embed =
            await createAIWelcomeEmbed(
                member.id,
            );

        await sendMessageToChannel(
            TEST_CHANNEL,
            {
                embeds: [embed],
            },
        );

        await interaction.editReply(
            "🤖 AI Welcome успешно сгенерирован.",
        );
    } catch (error) {
        console.error(
            "[TEST] AI Welcome failed:",
            error,
        );

        await interaction.editReply(
            "❌ AI Welcome завершился ошибкой.",
        );
    }
}

/**
 * Полный тест.
 *
 * Здесь не дублируем guildMemberUpdate.
 * Мы изменяем реальные Discord-данные,
 * поэтому реальные events должны сработать сами.
 */
async function testFull(
    interaction: ButtonInteraction<"cached">,
): Promise<void> {
    const member =
        interaction.member;

    await interaction.deferReply({
        ephemeral: true,
    });

    const results: string[] = [];

    try {
        // 1. AI
        try {
            const embed =
                await createAIWelcomeEmbed(
                    member.id,
                );

            await sendMessageToChannel(
                TEST_CHANNEL,
                {
                    embeds: [embed],
                },
            );

            results.push(
                "✅ AI Welcome",
            );
        } catch (error) {
            console.error(
                "[TEST FULL] AI Welcome:",
                error,
            );

            results.push(
                "❌ AI Welcome",
            );
        }

        // 2. Add role
        try {
            if (
                !member.roles.cache.has(
                    NOT_VERIFIED_USER_ROLE,
                )
            ) {
                await member.roles.add(
                    NOT_VERIFIED_USER_ROLE,
                    "Test: full test - add role",
                );

                results.push(
                    "✅ Add Role",
                );
            } else {
                results.push(
                    "ℹ️ Add Role — роль уже есть",
                );
            }
        } catch (error) {
            console.error(
                "[TEST FULL] Add Role:",
                error,
            );

            results.push(
                "❌ Add Role",
            );
        }

        // Небольшая пауза,
        // чтобы Discord успел обработать событие.
        await sleep(1000);

        // 3. Nickname
        try {
            const nickname =
                `TEST_${Date.now()
                    .toString()
                    .slice(-6)}`;

            await member.setNickname(
                nickname,
                "Test: full test - nickname",
            );

            results.push(
                "✅ Nickname",
            );
        } catch (error) {
            console.error(
                "[TEST FULL] Nickname:",
                error,
            );

            results.push(
                "❌ Nickname",
            );
        }

        await sleep(1000);

        // 4. Remove role
        try {
            if (
                member.roles.cache.has(
                    NOT_VERIFIED_USER_ROLE,
                )
            ) {
                await member.roles.remove(
                    NOT_VERIFIED_USER_ROLE,
                    "Test: full test - remove role",
                );

                results.push(
                    "✅ Remove Role",
                );
            } else {
                results.push(
                    "ℹ️ Remove Role — роли нет",
                );
            }
        } catch (error) {
            console.error(
                "[TEST FULL] Remove Role:",
                error,
            );

            results.push(
                "❌ Remove Role",
            );
        }

        await sleep(1000);

        // 5. Member Leave
        try {
            await sendMessageToChannel(
                LOG_CHANNEL,
                `🧪 Имитация **Member Leave** для <@${member.id}>.`,
            );

            results.push(
                "✅ Member Leave",
            );
        } catch (error) {
            console.error(
                "[TEST FULL] Member Leave:",
                error,
            );

            results.push(
                "❌ Member Leave",
            );
        }

        await interaction.editReply({
            content: [
                "🧪 **FULL TEST завершён**",
                "",
                ...results,
                "",
                "Проверь LOG_CHANNEL — реальные guildMemberUpdate события должны были отработать.",
            ].join("\n"),
        });
    } catch (error) {
        console.error(
            "[TEST FULL] Failed:",
            error,
        );

        await interaction.editReply(
            "❌ FULL TEST завершился критической ошибкой.",
        );
    }
}

function sleep(
    milliseconds: number,
): Promise<void> {
    return new Promise(
        (resolve) =>
            setTimeout(
                resolve,
                milliseconds,
            ),
    );
}