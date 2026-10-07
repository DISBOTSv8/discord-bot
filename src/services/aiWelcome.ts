import {
    EmbedBuilder,
} from "discord.js";

import { openai } from "../ai/openai";

import {
    OPENAI_MODEL,
    PROMT_CHANEL,
} from "../config";

import { client } from "../client";

export async function generateAIWelcome(): Promise<string> {
    const response =
        await openai.responses.create({
            model: OPENAI_MODEL,
            input: [
                {
                    role: "developer",
                    content: `
Ты AI-бот компании друзей в Discord.

Придумай короткое интересное приветствие для нового участника.

Стиль:
- дружелюбно;
- немного саркастично;
- сухой юмор;
- немного абсурда;
- атмосфера компании друзей;
- можно слегка использовать атмосферу DayZ.

Правила:
- 1–2 предложения;
- максимум 200 символов;
- только русский язык;
- не используй имя пользователя;
- не используй Discord username;
- не обращайся к пользователю по имени;
- не используй команду /указать_ник;
- не объясняй правила сервера;
- не используй слово "лут";
- не используй слово "тиммейт";
- не используй "килл";
- не используй "кемпер";
- не используй "вайп";
- не используй "рейд";
- не используй "респаун";
- не используй "хедшот";
- не используй "скилл";
- не используй "онлайн".

Приветствие должно звучать так, будто его написал бот,
который уже давно тусуется в компании друзей.

Верни только готовое приветствие.
                    `.trim(),
                },
            ],
        });

    return (
        response.output_text?.trim() ||
        "Добро пожаловать! Посмотрим, сколько ты продержишься 😏"
    );
}

export async function createAIWelcomeEmbed(
    memberId: string,
): Promise<EmbedBuilder> {
    const welcome =
        await generateAIWelcome();

    const embed =
        new EmbedBuilder()
            .setDescription(
                [
                    welcome,
                    "",
                    `Укажи свой ник <@${memberId}> в игре через слэш-команду \`/указать_ник\`, чтобы получить роль и доступ к серверу.`,
                ].join("\n"),
            );

    try {
        const channel =
            await client.channels.fetch(
                PROMT_CHANEL,
            );

        if (
            channel &&
            channel.isTextBased() &&
            "messages" in channel
        ) {
            const message =
                await channel.messages.fetch(
                    "1554210539305963642",
                );

            const image =
                message.attachments.first()
                    ?.url;

            if (image) {
                embed.setImage(image);
            }
        }
    } catch (error) {
        console.error(
            "[AI WELCOME] Failed to get welcome image:",
            error,
        );
    }

    return embed;
}