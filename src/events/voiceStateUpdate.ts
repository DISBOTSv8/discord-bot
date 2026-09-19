import {
    EmbedBuilder,
    VoiceState,
} from "discord.js";

const voiceSessions =
    new Map<string, NodeJS.Timeout>();

export const voiceStateUpdate = async (
    oldState: VoiceState,
    newState: VoiceState,
): Promise<void> => {
    const userId = newState.id;
    const guildId = newState.guild.id;
    const key = `${guildId}:${userId}`;

    const member = newState.member;

    if (!member || member.user.bot) {
        return;
    }

    // JOIN
    if (
        !oldState.channelId &&
        newState.channelId
    ) {
        console.log(
            `[VOICE JOIN] ${member.user.tag} → ` +
            `${newState.channel?.name}`,
        );

        if (voiceSessions.has(key)) {
            return;
        }

        const timer = setInterval(
            async () => {
                try {
                    const currentMember =
                        await newState.guild.members
                            .fetch(userId)
                            .catch(() => null);

                    if (
                        !currentMember ||
                        !currentMember.voice.channelId
                    ) {
                        clearInterval(timer);
                        voiceSessions.delete(key);

                        return;
                    }

                    const xp =
                        XP_REWARDS.VOICE_MINUTE;

                    const result =
                        await giveXp(
                            guildId,
                            userId,
                            "VOICE_MINUTE",
                            xp,
                        );

                    console.log(
                        `[VOICE XP] ${member.user.tag} → +${xp} XP`,
                    );

                    if (
                        result?.leveledUp
                    ) {
                        const channel =
                            newState.guild
                                .systemChannel;

                        if (channel) {
                            const embed =
                                new EmbedBuilder()
                                    .setColor(
                                        "#2ecc71",
                                    )
                                    .setDescription(
                                        `🐟 Окунь <@${userId}> **повысил уровень!**\n\n` +
                                        `⭐ **${result.oldLevel} → ${result.newLevel}**`,
                                    );

                            await channel.send({
                                embeds: [embed],
                            });
                        }
                    }
                } catch (error) {
                    console.error(
                        "[VOICE XP ERROR]",
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

    // LEAVE
    if (
        oldState.channelId &&
        !newState.channelId
    ) {
        const timer =
            voiceSessions.get(key);

        if (timer) {
            clearInterval(timer);
            voiceSessions.delete(key);
        }

        console.log(
            `[VOICE LEAVE] ${member.user.tag} ← ` +
            `${oldState.channel?.name}`,
        );

        return;
    }

    // MOVE
    if (
        oldState.channelId &&
        newState.channelId &&
        oldState.channelId !==
        newState.channelId
    ) {
        console.log(
            `[VOICE MOVE] ${member.user.tag}: ` +
            `${oldState.channel?.name} → ` +
            `${newState.channel?.name}`,
        );
    }
};