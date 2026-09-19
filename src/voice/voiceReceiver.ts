import {
    EndBehaviorType,
    VoiceConnection,
} from "@discordjs/voice";

import type { VoiceChannel } from "discord.js";

import prism from "prism-media";

import {
    speechToText,
} from "./speechToText";

import {
    processVoiceCommand,
} from "../commands/voice/processVoiceCommand";

const processingUsers =
    new Set<string>();

export const handleSpeaker = async (
    connection: VoiceConnection,
    channel: VoiceChannel,
    userId: string,
): Promise<void> => {
    const key =
        `${channel.guild.id}:${userId}`;

    // Prevent duplicate processing
    if (processingUsers.has(key)) {
        return;
    }

    processingUsers.add(key);

    const member =
        channel.guild.members.cache.get(
            userId,
        );

    const username =
        member?.displayName ??
        member?.user.username ??
        userId;

    console.log(
        `\n🎙️ [VOICE] ${username} started speaking`,
    );

    try {
        const opusStream =
            connection.receiver.subscribe(
                userId,
                {
                    end: {
                        behavior:
                        EndBehaviorType.AfterSilence,

                        duration: 1200,
                    },
                },
            );

        const decoder =
            new prism.opus.Decoder({
                rate: 48000,
                channels: 2,
                frameSize: 960,
            });

        const chunks: Buffer[] = [];

        decoder.on(
            "data",
            (chunk: Buffer) => {
                chunks.push(chunk);
            },
        );

        decoder.on(
            "error",
            (error) => {
                console.error(
                    `❌ [VOICE] Decoder error for ${username}:`,
                    error,
                );
            },
        );

        opusStream.on(
            "error",
            (error) => {
                console.error(
                    `❌ [VOICE] Opus error for ${username}:`,
                    error,
                );
            },
        );

        opusStream.pipe(decoder);

        await new Promise<void>(
            (resolve) => {
                let resolved = false;

                const done = () => {
                    if (resolved) {
                        return;
                    }

                    resolved = true;
                    resolve();
                };

                decoder.once(
                    "end",
                    done,
                );

                decoder.once(
                    "error",
                    done,
                );

                opusStream.once(
                    "error",
                    done,
                );
            },
        );

        if (!chunks.length) {
            console.log(
                `🔇 [VOICE] No audio from ${username}`,
            );

            return;
        }

        const pcm =
            Buffer.concat(chunks);

        console.log(
            `📦 [VOICE] ${username}: ${pcm.length} bytes`,
        );

        if (pcm.length < 20_000) {
            console.log(
                `🔇 [VOICE] Audio too short from ${username}`,
            );

            return;
        }

        console.log(
            `🧠 [VOICE] Sending ${username}'s audio to Vosk...`,
        );

        // IMPORTANT: await!
        const text =
            await speechToText(pcm);

        if (!text) {
            console.log(
                `🔇 [VOICE] No speech detected from ${username}`,
            );

            return;
        }

        console.log(
            `📝 [VOICE] ${username}: "${text}"`,
        );

        await processVoiceCommand(
            channel,
            userId,
            text,
        );
    } catch (error) {
        console.error(
            `❌ [VOICE] Failed to process ${username}:`,
            error,
        );
    } finally {
        processingUsers.delete(key);
    }
};