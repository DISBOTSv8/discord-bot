export function parseDuration(
    value: string | undefined,
): number | undefined {
    if (!value) {
        return undefined;
    }

    const normalized =
        value.trim().toLowerCase();

    const match =
        normalized.match(
            /^(\d+)\s*(s|sec|сек|m|min|мин|h|hour|ч|d|day|д)$/i,
        );

    if (!match) {
        return undefined;
    }

    const amount =
        Number(match[1]);

    const unit = match[2];

    const multipliers: Record<
        string,
        number
    > = {
        s: 1000,
        sec: 1000,
        сек: 1000,

        m: 60 * 1000,
        min: 60 * 1000,
        мин: 60 * 1000,

        h: 60 * 60 * 1000,
        hour: 60 * 60 * 1000,
        ч: 60 * 60 * 1000,

        d: 24 * 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        д: 24 * 60 * 60 * 1000,
    };

    const multiplier =
        multipliers[unit];

    if (!multiplier) {
        return undefined;
    }

    return amount * multiplier;
}