import OpenAI from "openai";

import {
    OPENAI_API_KEY,
    OPENAI_MODEL,
} from "../config";

import {
    parseDuration,
} from "../moderation/parseDuration";

import {
    ParsedCommand,
} from "../moderation/moderationTypes";

const openai =
    new OpenAI({
        apiKey: OPENAI_API_KEY,
    });

const COMMAND_PROMPT = `
Ты — распознаватель команд Discord-бота Гост.

Ты НЕ выполняешь команды.
Ты только определяешь намерение пользователя и возвращаешь JSON.

Доступные действия:

timeout
untimeout
kick
ban
unban
warn
add_role
remove_role
nickname
mention
mute_voice

Типы намерения:

execute
check_capability

Если пользователь спрашивает:
"можешь забанить?"
"умеешь мутить?"
"ты можешь дать варнинг?"

это check_capability.

Если пользователь реально просит выполнить действие:
"забань Тома"
"замути @Tom на 10 минут"
"гост дай ему мут"

это execute.

ПРАВИЛА ОПРЕДЕЛЕНИЯ ЦЕЛИ:

1. Если цель указана через Discord mention,
используй ID из mentionedUserIds.

2. Никогда не придумывай Discord ID.

3. Если цель названа конкретным именем или ником,
запиши это имя буквально в targetQuery.

Например:

"забань Тома"

targetUserId = null
targetQuery = "Тома"

4. Если пользователь использует:
"он"
"его"
"ему"
"она"
"её"
"ей"
"этого"
"этого типа"
"этого человека"
"ему мут"
"дай ему мут"

используй recentMessages и repliedTo.

5. В recentMessages сообщения имеют формат:

Имя [DISCORD_ID]: текст

Например:

FXCUS [123456789]: Я Никитос
KINGSLAYER [987654321]: гост дай ему мут на минуту

Если из контекста однозначно понятно,
что "ему" относится к FXCUS,
верни:

targetUserId = "123456789"

6. Если человек ранее явно связал свой ник с именем:

"FXCUS = Никитос"
"Я FXCUS, но зовите меня Никитосом"
"FXCUS это Никитос"

то в последующих командах:

"замути Никитоса"
"забань Никитоса"
"дай ему мут"

можно использовать ID FXCUS,
если контекст однозначный.

7. Не используй ID автора текущей команды
как targetUserId только потому,
что он написал команду.

8. Если цель не может быть определена однозначно:

targetUserId = null
targetQuery = null

9. Если цель может быть определена по recentMessages,
приоритет у targetUserId.

10. Не придумывай Discord ID.
Используй только ID, которые реально присутствуют
в mentionedUserIds, repliedTo или recentMessages.

11. Для timeout обязательно извлекай duration.

Примеры:

"на минуту"
duration = "1 минута"

"на 5 минут"
duration = "5 минут"

"на 30 секунд"
duration = "30 секунд"

"на час"
duration = "1 час"

"на 2 часа"
duration = "2 часа"

12. Для роли используй roleName.

13. Для ника используй nickname.

14. Для причины используй reason.

15. Для "тегни его" используй mentionTarget=true.

16. Обычный разговор возвращай как:

{
    "command": null
}

ВАЖНО:

Не выполняй действие.
Не придумывай пользователя.
Не придумывай Discord ID.
Не выбирай пользователя случайно.
Если контекст однозначно указывает на конкретного пользователя,
используй его реальный Discord ID.

Формат ответа ВСЕГДА:

{
    "command": {
        "intent": "execute",
        "action": "timeout",
        "targetUserId": "123456789",
        "targetQuery": null,
        "duration": "1 минута",
        "roleName": null,
        "nickname": null,
        "reason": null,
        "mentionTarget": false
    }
}

или:

{
    "command": null
}
`;

interface RecognizerResponse {
    command:
        | {
        intent:
            ParsedCommand["intent"];

        action:
            ParsedCommand["action"];

        targetUserId:
            string | null;

        targetQuery?:
            string | null;

        duration?:
            string | null;

        roleName?:
            string | null;

        nickname?:
            string | null;

        reason?:
            string | null;

        mentionTarget?:
            boolean;
    }
        | null;
}

interface RecognizeContext {
    mentionedUserIds: string[];

    repliedTo?: {
        id: string;
        displayName: string;
    };

    recentMessages?: string;
}

export async function recognizeCommand(
    message: string,
    context: RecognizeContext,
): Promise<ParsedCommand | null> {
    const response =
        await openai.responses.create({
            model: OPENAI_MODEL,
            input: [
                {
                    role: "developer",
                    content:
                    COMMAND_PROMPT,
                },
                {
                    role: "user",
                    content:
                        JSON.stringify({
                            message,
                            mentionedUserIds:
                            context.mentionedUserIds,
                            repliedTo:
                                context.repliedTo ??
                                null,
                            recentMessages:
                                context.recentMessages ??
                                null,
                        }),
                },
            ],
        });

    const text =
        response.output_text?.trim();

    if (!text) {
        return null;
    }

    try {
        const result =
            JSON.parse(
                text,
            ) as RecognizerResponse;

        if (!result.command) {
            return null;
        }

        const command =
            result.command;

        if (
            command.intent !==
            "execute" &&
            command.intent !==
            "check_capability"
        ) {
            return null;
        }

        if (
            command.targetUserId &&
            !isKnownUserId(
                command.targetUserId,
                context,
            )
        ) {
            return null;
        }

        if (
            command.intent ===
            "check_capability"
        ) {
            return {
                intent:
                    "check_capability",

                action:
                command.action,

                targetUserId:
                    null,

                targetQuery:
                undefined,

                durationMs:
                undefined,

                roleName:
                    command.roleName ??
                    undefined,

                nickname:
                    command.nickname ??
                    undefined,

                reason:
                    command.reason ??
                    undefined,

                mentionTarget:
                    false,
            };
        }

        return {
            intent:
                "execute",

            action:
            command.action,

            targetUserId:
            command.targetUserId,

            targetQuery:
                command.targetQuery ??
                undefined,

            durationMs:
                parseDuration(
                    command.duration ??
                    undefined,
                ),

            roleName:
                command.roleName ??
                undefined,

            nickname:
                command.nickname ??
                undefined,

            reason:
                command.reason ??
                undefined,

            mentionTarget:
                command.mentionTarget ??
                false,
        };
    } catch (error) {
        console.error(
            "[COMMAND RECOGNIZER] Failed to parse response:",
            error,
        );

        return null;
    }
}

function isKnownUserId(
    targetUserId: string,
    context: RecognizeContext,
): boolean {
    if (
        context.mentionedUserIds.includes(
            targetUserId,
        )
    ) {
        return true;
    }

    if (
        context.repliedTo?.id ===
        targetUserId
    ) {
        return true;
    }

    const recentMessages =
        context.recentMessages ?? "";

    return recentMessages.includes(
        `[${targetUserId}]`,
    );
}