import type { VoiceChannel } from "discord.js";

const MUTE_DURATION = 10_000;

export const muteEveryone = async (
    channel: VoiceChannel,
): Promise<void> => {
    console.log(
        `🔇 [VOICE] Muting everyone in ${channel.name}`,
    );

    const members =
        [...channel.members.values()]
            .filter(
                (member) =>
                    !member.user.bot,
            );

    for (const member of members) {
        try {
            await member.voice.setMute(
                true,
                "Voice command: всем мут",
            );

            console.log(
                `🔇 [VOICE] Muted ${member.displayName}`,
            );
        } catch (error) {
            console.error(
                `❌ [VOICE] Failed to mute ${member.displayName}`,
                error,
            );
        }
    }

    setTimeout(
        async () => {
            for (
                const member of members
                ) {
                try {
                    // User could already have left
                    if (
                        !member.voice.channelId
                    ) {
                        continue;
                    }

                    await member.voice.setMute(
                        false,
                        "Voice mute expired",
                    );

                    console.log(
                        `🔊 [VOICE] Unmuted ${member.displayName}`,
                    );
                } catch (error) {
                    console.error(
                        `❌ [VOICE] Failed to unmute ${member.displayName}`,
                        error,
                    );
                }
            }

            console.log(
                `🔊 [VOICE] Everyone unmuted`,
            );
        },
        MUTE_DURATION,
    );
};