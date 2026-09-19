import {
    ChatInputCommandInteraction,
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    Partials,
    type GuildMember, EmbedBuilder,
} from "discord.js";
import "dotenv/config";

import {setData, getData, updateNickname} from "./db/discord-users";
import {initDb, closeDb} from "./db";
import {giveXp} from "./services/xp.service";
import {XP_REWARDS} from "./config/experience";

const voiceSessions = new Map<string, NodeJS.Timeout>();

const token = process.env.DISCORD_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

let SERVER_ROLES = null;
let SERVER_CHANNELS = null;

const LOG_CHANNEL = "1542974738866110514";
const NICKNAME_CHANEL = "1542950154804400168";
const WHY_YOU_ARE = "1542949636661059634"

const NOT_VERIFIED_USER_ROLE = "1542945379753001080";
const VERIFIED_USER_ROLE = "1497240251813597274";

if (!token) {
    throw new Error(
        "DISCORD_TOKEN is missing. Add the bot token as a Replit Secret before starting the bot.",
    );
}

const requiredToken = token;

const commands = [
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check whether the bot is responsive."),
    new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show the commands this bot supports."),
    new SlashCommandBuilder()
        .setName("update_nickname")
        .setNameLocalizations({
            ru: "обновить_ник",
        })
        .setDescription("Update nickname")
        .addStringOption((option) =>
            option
                .setName("nickname")
                .setNameLocalizations({
                    ru: "никнейм",
                })
                .setDescription("The new nickname you want to set")
                .setDescriptionLocalizations({
                    ru: "Новый никнейм, который ты хочешь установить",
                })
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("set_nickname")
        .setNameLocalizations({
            ru: "указать_ник",
        })
        .setDescription("Set nickname")
        .addStringOption((option) =>
            option
                .setName("nickname")
                .setNameLocalizations({
                    ru: "никнейм",
                })
                .setDescription("The new nickname you want to set")
                .setDescriptionLocalizations({
                    ru: "Укажи свой никнейм",
                })
                .setRequired(true),
        ),
    new SlashCommandBuilder()
        .setName("stats")
        .setNameLocalizations({
            ru: "статистика",
        })
        .setDescription("Stats"),
].map((command) => command.toJSON());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],

    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
});

const getServerRoles = () => {
    const guild = client.guilds.cache.get(guildId || "");

    if (!guild) {
        return {};
    }

    return guild.roles.cache.reduce<Record<string, string>>((acc, role) => {
        acc[role.id] = role.name;
        return acc;
    }, {});
};

const getServerChannels = () => {
    const guild = client.guilds.cache.get(guildId || "");

    if (!guild) {
        return {};
    }

    return guild.channels.cache.reduce<Record<string, string>>(
        (acc, channel) => {
            acc[channel.id] = channel.name;
            return acc;
        },
        {},
    );
};

const saveMemberData = async (
    member: GuildMember,
): Promise<void> => {
    await setData({
        guildId: member.guild.id,
        userId: member.user.id,
        username: member.user.username,
        displayName: member.displayName,
        joinedAt: member.joinedAt ?? new Date(),
    });
};

const syncExistingMembers = async (): Promise<void> => {
    console.info("🔄 Starting members sync...");

    if (!guildId) {
        throw new Error("DISCORD_GUILD_ID is missing");
    }

    const guild = client.guilds.cache.get(guildId);

    if (!guild) {
        throw new Error(
            `Guild ${guildId} not found`,
        );
    }

    console.info(
        `🏠 Guild: ${guild.name} (${guild.id})`,
    );

    console.info(
        `📦 Cached members: ${guild.members.cache.size}`,
    );

    console.info("📥 Fetching members from Discord...");

    const members = await Promise.race([
        guild.members.fetch(),

        new Promise<never>((_, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(
                            "guild.members.fetch() timed out after 30 seconds",
                        ),
                    ),
                30_000,
            ),
        ),
    ]);

    console.info(
        `👥 Found ${members.size} members`,
    );

    for (const member of members.values()) {
        if (member.user.bot) {
            continue;
        }

        await saveMemberData(member);
    }

    console.info(
        `✅ Saved members for ${guild.name}`,
    );
};

const sendMessageToChannel = async (channelId: string, message: string) => {
    const channel = client.channels.cache.get(channelId);

    if (channel?.isSendable()) {
        try {
            await channel.send(message);
        } catch (error) {
            console.error(
                `Failed to send message to channel ${channelId}:`,
                error,
            );
        }
    } else {
        console.warn(
            `Channel ${channelId} not found in cache or is not text-based.`,
        );
    }
};

const getTimePassed = (date) => {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days >= 365) {
        const years = Math.floor(days / 365);
        return `${years} ${years === 1 ? "год" : years < 5 ? "года" : "лет"}`;
    }

    if (days >= 30) {
        const months = Math.floor(days / 30);
        return `${months} ${months === 1 ? "месяц" : months < 5 ? "месяца" : "месяцев"}`;
    }

    if (days >= 7) {
        const weeks = Math.floor(days / 7);
        return `${weeks} ${weeks === 1 ? "неделя" : weeks < 5 ? "недели" : "недель"}`;
    }

    return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"}`;
};

async function registerCommands(): Promise<void> {
    if (!client.user || !client.application) {
        throw new Error("Discord application is not ready yet.");
    }

    const rest = new REST({version: "10"}).setToken(requiredToken);
    const applicationId = client.application.id;

    if (guildId) {
        await rest.put(
            Routes.applicationGuildCommands(applicationId, guildId),
            {
                body: commands,
            },
        );
        console.info(
            `Registered ${commands.length} commands for guild ${guildId}.`,
        );
        return;
    }

    await rest.put(Routes.applicationCommands(applicationId), {
        body: commands,
    });
    console.info(`Registered ${commands.length} global commands.`);
}

async function handleCommand(
    interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> {
    const nickname = interaction.options.getString("nickname");
    const member = interaction.member;

    switch (interaction.commandName) {
        case "ping":
            await interaction.reply(`Пинг: ${client.ws.ping}ms.`);
            return;
        case "help":
            await interaction.reply({
                content:
                    "**Доступные команды**\n" +
                    "`/ping` — Проверь свой пинг.\n" +
                    "`/обновить_ник` — Обновить ник.\n" +
                    "`/установить_ник` — Установить ник.\n" +
                    "`/статистика` — Узнать свою статистику на сервере.\n" +
                    "`/help` — Список всех команд.\n",
                ephemeral: true,
            });
            return;
        case "update_nickname":
            if (interaction.member.roles.cache.has(NOT_VERIFIED_USER_ROLE)) {
                await interaction.reply({
                    content: "С данной ролью нельзя обновить ник. Используй команду `/установить_ник`",
                    ephemeral: true,
                });
                return;
            }

            await interaction.reply({
                content: "Ник успешно изменен",
                ephemeral: true,
            });

            await updateNickname(
                guildId,
                interaction.member.id,
                nickname,
            );

            await sendMessageToChannel(
                NICKNAME_CHANEL,
                `<@${interaction.member.id}> изменил ник: ${nickname}\n-------------------------`,
            );

            await sendMessageToChannel(
                LOG_CHANNEL,
                `<@${interaction.member.id}> изменил ник: ${nickname}`,
            );

            return;
        case "set_nickname":
            if (interaction.member.roles.cache.has(VERIFIED_USER_ROLE)) {
                await interaction.reply({
                    content: `С данной ролью нельзя установить ник. Используй команду \`/обновить_ник\``,
                    ephemeral: true,
                });
                return;
            }

            await interaction.member.roles.remove(NOT_VERIFIED_USER_ROLE);
            await interaction.member.roles.add(VERIFIED_USER_ROLE);

            await updateNickname(guildId, interaction.member.id, nickname)

            await interaction.reply({
                content: `Ник ${nickname} успешно установлен \n -------------------------`,
                ephemeral: true,
            });

            const msg = `<@${interaction.member.id}> указал ник: ${nickname}`;

            sendMessageToChannel(NICKNAME_CHANEL, msg);
            sendMessageToChannel(LOG_CHANNEL, msg);

            return;
        case "stats": {
            const memberData = await getData(
                guildId || "",
                member.id,
            );

            if (!memberData) {
                await interaction.reply({
                    content: "❌ Данные пользователя не найдены.",
                    ephemeral: true,
                });

                return;
            }

            const joinedAt = memberData.joinedAt
                ? new Date(memberData.joinedAt)
                : null;

            const joinedText = joinedAt
                ? `${joinedAt.toLocaleDateString("ru-RU")} (${getTimePassed(joinedAt)})`
                : "Неизвестно";

            const exp = Number(memberData.exp ?? 0);
            const level = memberData.level ?? 1;

            const expForCurrentLevel =
                level * (level - 1) * 50;

            const expForNextLevel =
                level * (level + 1) * 50;

            const currentXp = Math.max(
                0,
                exp - expForCurrentLevel,
            );

            const requiredXp =
                expForNextLevel - expForCurrentLevel;

            const progress = Math.min(
                Math.max(currentXp / requiredXp, 0),
                1,
            );

            const percent = Math.round(progress * 100);

            const progressSize = 12;
            const filled = Math.round(
                progress * progressSize,
            );

            const progressBar =
                "🟩".repeat(filled) +
                "⬛".repeat(progressSize - filled);

            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle("👤 Статистика Окуня")
                .setDescription(
                    `**Окунь:** ${memberData.displayName ?? member.user.username}\n` +
                    `**Ник:** \`${memberData.nickname ?? "Не установлен"}\`\n` +
                    `**На сервере с:** ${joinedText}\n\n` +

                    `⭐ **Окунь:** ${level} Уровня\n` +
                    `${progressBar} **${percent}%**\n` +
                    `✨ **XP:** ${currentXp.toFixed(1)} / ${requiredXp}\n` +
                    `📈 **Всего XP:** ${exp.toFixed(1)}`,
                )
                .setThumbnail(
                    member.user.displayAvatarURL({
                        size: 256,
                    }),
                )
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });

            sendMessageToChannel(
                LOG_CHANNEL,
                `<@${member.id}> запросил статистику`,
            );

            return;
        }
        default:
            await interaction.reply({
                content: "Данной команды не существует",
                ephemeral: true,
            });
    }
}

client.once("clientReady", async (readyClient) => {
    console.info(`Logged in as ${readyClient.user.tag}.`);

    try {
        await initDb();

        SERVER_ROLES = getServerRoles();
        SERVER_CHANNELS = getServerChannels();

        console.log("roles", SERVER_ROLES);
        console.log("channels", SERVER_CHANNELS);

        await syncExistingMembers();
        await registerCommands();

        console.info("Bot initialization completed.");
    } catch (error) {
        console.error("Failed to initialize bot.", error);

        await closeDb();
        await readyClient.destroy();

        process.exitCode = 1;
    }
});

client.on("guildMemberAdd", async (member) => {
    // Save member
    try {
        await saveMemberData(member);

        console.info(
            `[MEMBER JOIN] Saved ${member.user.tag} (${member.user.id}) to DB.`,
        );
    } catch (error) {
        console.error(
            `[MEMBER JOIN] Failed to save ${member.user.tag}.`,
            error,
        );
    }

    // Add not verified role
    try {
        await member.roles.add(NOT_VERIFIED_USER_ROLE);

        console.info(
            `[MEMBER JOIN] Added not verified role to ${member.user.tag}.`,
        );
    } catch (error) {
        console.error(
            `[MEMBER JOIN] Failed to add role to ${member.user.tag}.`,
            error,
        );
    }

    // Welcome message
    try {
        await sendMessageToChannel(
            WHY_YOU_ARE,
            `Укажи свой ник <@${member.user.id}> в игре через слэш команду \`/указать_ник\`, чтобы получить роль и доступ к серверу`,
        );
    } catch (error) {
        console.error(
            `[MEMBER JOIN] Failed to send welcome message.`,
            error,
        );
    }
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter(
        (role) => !oldRoles.has(role.id) && role.id !== newMember.guild.id,
    );

    for (const role of addedRoles.values()) {
        await sendMessageToChannel(
            LOG_CHANNEL,
            `Участнику <@${newMember.id}> добавили роль: **${role.name}**`,
        );

        if(role.id === NOT_VERIFIED_USER_ROLE) {
            await sendMessageToChannel(
                WHY_YOU_ARE,
                `Укажи свой ник <@${newMember.id}> в игре через слэш команду \`/указать_ник\`, чтобы получить роль и доступ к серверу`,
            );
        }
    }

    const removedRoles = oldRoles.filter(
        (role) => !newRoles.has(role.id) && role.id !== newMember.guild.id,
    );

    for (const role of removedRoles.values()) {
        await sendMessageToChannel(
            LOG_CHANNEL,
            `У участника <@${newMember.id}> забрали роль: **${role.name}**`,
        );
    }

    if (oldMember.nickname !== newMember.nickname) {
        await sendMessageToChannel(
            LOG_CHANNEL,
            `Пользователь <@${newMember.id}> изменил ник:\n` +
            `**${oldMember.nickname ?? "нет ника"}** → **${newMember.nickname ?? "нет ника"}**`,
        );
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (interaction.guild) {
        const result = await giveXp(
            interaction.guild.id,
            interaction.user.id,
            "COMMAND",
        );

        if (result?.leveledUp) {
            const embed = new EmbedBuilder()
                .setColor('#2ecc71')
                .setTitle("🐟 Окунь повысил уровень!")
                .setDescription(
                    `<@${interaction.user.displayName}>\n\n` +
                    `⭐ **${result.oldLevel}** → **${result.newLevel}**`,
                );

            await interaction.followUp({
                embeds: [embed],
                ephemeral: true,
            });
        }
    }

    if (!interaction.inCachedGuild()) {
        await interaction.reply({
            content: "Эта команда доступна только на сервере.",
            ephemeral: true,
        });
        return;
    }

    try {
        await handleCommand(interaction);
    } catch (error) {
        console.error(
            `Команда "${interaction.commandName}" завершилась с ошибкой.`,
            error,
        );

        const reply = {
            content: "Что-то пошло не так пока команда выполнялась.",
            ephemeral: true,
        };

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(reply);
        } else {
            await interaction.reply(reply);
        }
    }
});

client.on("messageCreate", async (message) => {
    if (
        message.author.bot ||
        !message.guild
    ) {
        return;
    }

    const result = await giveXp(
        message.guild.id,
        message.author.id,
        "MESSAGE",
    );

    if (result?.leveledUp) {
        const embed = new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle("🐟 Окунь повысил уровень!")
            .setDescription(
                `<@${message.author.displayName}>\n\n` +
                `⭐ **${result.oldLevel}** → **${result.newLevel}**`,
            );

        await message.channel.send({
            embeds: [embed],
        });
    }
});

client.on(
    "voiceStateUpdate",
    async (oldState, newState) => {
        const userId = newState.id;
        const guildId = newState.guild.id;
        const member = newState.member;

        const key =
            `${guildId}:${userId}`;

        const username =
            member?.displayName ??
            member?.user.username ??
            userId;

        if (member?.user.bot) {
            return;
        }

        if (
            !oldState.channelId &&
            newState.channelId
        ) {
            const channel =
                newState.channel;

            if (
                !channel ||
                !channel.isVoiceBased()
            ) {
                return;
            }

            console.log(
                `\n🎙️ [VOICE JOIN] ${username} (${userId})`,
            );

            console.log(
                `   └─ Channel: ${channel.name}`,
            );

            if (
                voiceSessions.has(
                    key,
                )
            ) {
                console.log(
                    `⚠️ [VOICE XP] Session already exists → ${username}`,
                );

                return;
            }

            voiceSessions.set(
                key,
                Date.now(),
            );

            console.log(
                `⏱️ [VOICE XP] Session started → ${username}`,
            );

            const timer =
                setInterval(
                    async () => {
                        try {
                            const currentMember =
                                await newState
                                    .guild
                                    .members
                                    .fetch(
                                        userId,
                                    )
                                    .catch(
                                        () =>
                                            null,
                                    );

                            // User left voice
                            if (
                                !currentMember ||
                                !currentMember
                                    .voice
                                    .channelId
                            ) {
                                clearInterval(
                                    timer,
                                );

                                voiceSessions.delete(
                                    key,
                                );

                                console.log(
                                    `🚪 [VOICE XP] Session stopped → ${username}`,
                                );

                                return;
                            }

                            const xp =
                                XP_REWARDS
                                    .VOICE_MINUTE;

                            const result =
                                await giveXp(
                                    guildId,
                                    userId,
                                    "VOICE_MINUTE",
                                    xp,
                                );

                            console.log(
                                `⭐ [VOICE XP] ${username} → +${xp} XP`,
                            );

                            if (
                                result?.leveledUp
                            ) {
                                const systemChannel =
                                    newState
                                        .guild
                                        .systemChannel;

                                if (
                                    systemChannel
                                ) {
                                    const embed =
                                        new EmbedBuilder()
                                            .setColor(
                                                "#2ecc71",
                                            )
                                            .setDescription(
                                                `🐟 Окунь <@${userId}> **повысил уровень!**\n\n` +
                                                `⭐ **${result.oldLevel} → ${result.newLevel}**`,
                                            );

                                    await systemChannel.send(
                                        {
                                            embeds: [
                                                embed,
                                            ],
                                        },
                                    );
                                }
                            }
                        } catch (error) {
                            console.error(
                                `❌ [VOICE XP ERROR] ${username} (${userId})`,
                                error,
                            );
                        }
                    },
                    60_000,
                );

            voiceSessions.set(
                key,
                timer,
            );

            return;
        }

        if (
            oldState.channelId &&
            !newState.channelId
        ) {
            const timer =
                voiceSessions.get(
                    key,
                );

            if (
                timer &&
                typeof timer !==
                "number"
            ) {
                clearInterval(
                    timer,
                );
            }

            voiceSessions.delete(
                key,
            );

            console.log(
                `\n🚪 [VOICE LEAVE] ${username} (${userId})`,
            );

            console.log(
                `   └─ Channel: ${
                    oldState.channel?.name ??
                    oldState.channelId
                }`,
            );

            return;
        }

        if (
            oldState.channelId &&
            newState.channelId &&
            oldState.channelId !==
            newState.channelId
        ) {
            console.log(
                `\n🔄 [VOICE MOVE] ${username} (${userId})`,
            );

            console.log(
                `   └─ ${
                    oldState.channel?.name ??
                    oldState.channelId
                } → ${
                    newState.channel?.name ??
                    newState.channelId
                }`,
            );

            return;
        }
    },
);

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) {
        return;
    }

    try {
        if (reaction.partial) {
            await reaction.fetch();
        }

        const guild = reaction.message.guild;

        if (!guild) {
            return;
        }

        const result = await giveXp(
            guild.id,
            user.id,
            "REACTION",
        );

        if (!result) {
            return;
        }

        console.log(
            `[REACTION XP] ${user.username} +${result.amount} XP`,
        );

        if (result.leveledUp) {
            const channel = reaction.message.channel;

            if (channel.isTextBased()) {
                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle("🐟 Окунь повысил уровень!")
                    .setDescription(
                        `<@${user.displayName}>\n\n` +
                        `⭐ **${result.oldLevel} → ${result.newLevel}**`,
                    );

                await channel.send({
                    embeds: [embed],
                });
            }
        }
    } catch (error) {
        console.error(
            "[REACTION XP] Error:",
            error,
        );
    }
});

const shutdown = async (signal: string): Promise<void> => {
    console.info(`Получатель ${signal}; выключился.`);
    await client.destroy();
};

process.once("SIGINT", () => {
    void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
});

void client.login(requiredToken).catch((error: unknown) => {
    console.error("Failed to connect to Discord.", error);
    process.exitCode = 1;
});
