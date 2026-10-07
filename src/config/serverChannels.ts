export interface ServerChannels {
    NICKNAME_CHANNEL: string;
    LOG_CHANNEL: string;
    NEWS_CHANNEL: string;
}

export function getServerChannels(): ServerChannels {
    const NICKNAME_CHANNEL =
        process.env.NICKNAME_CHANNEL;

    const LOG_CHANNEL =
        process.env.LOG_CHANNEL;

    const NEWS_CHANNEL =
        process.env.NEWS_CHANNEL;

    if (!NICKNAME_CHANNEL) {
        throw new Error(
            "NICKNAME_CHANNEL is not configured.",
        );
    }

    if (!LOG_CHANNEL) {
        throw new Error(
            "LOG_CHANNEL is not configured.",
        );
    }

    if (!NEWS_CHANNEL) {
        throw new Error(
            "NEWS_CHANNEL is not configured.",
        );
    }

    return {
        NICKNAME_CHANNEL,
        LOG_CHANNEL,
        NEWS_CHANNEL,
    };
}