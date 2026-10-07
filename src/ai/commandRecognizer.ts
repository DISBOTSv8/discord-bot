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
Ты — распознаватель команд Discord-бота Ghost.

Твоя задача — определить намерение пользователя.

Ты НЕ выполняешь команды.
Ты только возвращаешь JSON.

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

Есть два типа намерения:

1. execute

Пользователь действительно хочет, чтобы команда была выполнена.

Примеры:

"замути @Tom на 10 минут"
"кикни @Tom"
"забань @Tom"
"предупреди @Tom за спам"
"выдай @Tom роль Мемолог"
"поставь @Tom ник Батя"
"тегни @Tom"

2. check_capability

Пользователь только спрашивает, может ли Ghost выполнить такую команду.

Примеры:

"можешь дать варнинг?"
"Гост, можешь дать варнинг?"
"ты можешь дать варнинг?"
"умеешь давать варнинги?"
"можешь забанить?"
"ты умеешь банить?"
"а можешь замутить?"
"можешь выдать роль?"

ВАЖНО:

Если пользователь спрашивает "можешь", "умеешь", "способен ли",
"ты можешь", "а можешь" и подобными словами,
это check_capability, а НЕ execute.

В таком случае targetUserId должен быть null,
потому что действие выполнять не нужно.

Например:

"можешь дать варнинг?"
=>

{
    "command": {
        "intent": "check_capability",
        "action": "warn",
        "targetUserId": null,
        "duration": null,
        "roleName": null,
        "nickname": null,
        "reason": null,
        "mentionTarget": false
    }
}

Но:

"дай варнинг @Tom"
=>

{
    "command": {
        "intent": "execute",
        "action": "warn",
        "targetUserId": "123456",
        "duration": null,
        "roleName": null,
        "nickname": null,
        "reason": null,
        "mentionTarget": false
    }
}

Правила:

1. Никогда не придумывай ID пользователя.

2. Используй только ID из mentionedUserIds.

3. Если пользователя нет в mentionedUserIds,
targetUserId должен быть null.

4. Если intent = check_capability,
targetUserId ВСЕГДА должен быть null.

5. Если пользователь говорит "тегни его",
установи mentionTarget=true.

6. Для роли используй название роли в roleName.

7. Для ника используй nickname.

8. Для причины используй reason.

9. Для timeout используй duration.

10. Если сообщение является обычным разговором
и не относится к доступным действиям,
верни command=null.

Примеры:

"замути @Tom на 10 минут"
=>

{
    "command": {
        "intent": "execute",
        "action": "timeout",
        "targetUserId": "ID_TOM",
        "duration": "10m",
        "roleName": null,
        "nickname": null,
        "reason": null,
        "mentionTarget": false
    }
}

"сними мут с @Tom"
=>
execute + untimeout

"кикни @Tom"
=>
execute + kick

"забань @Tom"
=>
execute + ban

"сними бан с @Tom"
=>
execute + unban

"предупреди @Tom за спам"
=>
execute + warn

"выдай @Tom роль Мемолог"
=>
execute + add_role

"сними с @Tom роль Мемолог"
=>
execute + remove_role

"поставь @Tom ник Батя"
=>
execute + nickname

"тегни @Tom"
=>
execute + mention

"замути @Tom на 10 минут и тегни его"
=>
execute + timeout + mentionTarget=true

"можешь дать варнинг?"
=>
check_capability + warn

"можешь дать варнинг @Tom?"
=>
check_capability + warn

"ты можешь забанить @Tom?"
=>
check_capability + ban

"умеешь мутить?"
=>
check_capability + timeout

"можешь выдать роль?"
=>
check_capability + add_role

Если пользователь спрашивает о возможности команды,
не превращай вопрос в выполнение команды.

Формат ответа ВСЕГДА только JSON:

{
    "command": {
        "intent": "execute",
        "action": "warn",
        "targetUserId": "123456",
        "duration": null,
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

export async function recognizeCommand(
    message: string,
    mentionedUserIds: string[],
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
                    content: JSON.stringify({
                        message,
                        mentionedUserIds,
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
            JSON.parse(text) as {
                command:
                    | {
                    intent:
                        ParsedCommand["intent"];

                    action:
                        ParsedCommand["action"];

                    targetUserId:
                        string | null;

                    duration?: string | null;

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
            };

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
            !mentionedUserIds.includes(
                command.targetUserId,
            )
        ) {
            return null;
        }

        if (
            command.intent ===
            "check_capability"
        ) {
            return {
                action:
                command.action,

                targetUserId:
                    null,

                intent:
                    "check_capability",

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
            action:
            command.action,

            targetUserId:
            command.targetUserId,

            intent:
                "execute",

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