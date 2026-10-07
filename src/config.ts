function requireEnv(name: string): string {
    const value = process.env[name]

    if (!value) {
        throw new Error(
            `Environment variable "${name}" is not configured.`,
        )
    }

    return value
}

export const DISCORD_TOKEN = requireEnv("DISCORD_TOKEN")
export const GUILD_ID = process.env.DISCORD_GUILD_ID
export const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY")
export const OPENAI_MODEL = requireEnv("OPENAI_MODEL")
export const NOT_VERIFIED_USER_ROLE = requireEnv("NOT_VERIFIED_USER_ROLE")
export const VERIFIED_USER_ROLE = requireEnv("VERIFIED_USER_ROLE")
export const NICKNAME_CHANNEL = requireEnv("NICKNAME_CHANNEL")
export const LOG_CHANNEL = requireEnv("LOG_CHANNEL")
export const WHY_YOU_ARE = requireEnv("WHY_YOU_ARE")
export const PROMT_CHANEL = requireEnv("PROMT_CHANEL")
export const NEWS_CHANNEL = requireEnv("NEWS_CHANNEL")
export const TEST_CHANNEL = requireEnv("TEST_CHANNEL")