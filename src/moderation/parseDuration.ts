export function parseDuration(
    value?: string | null,
): number | undefined {
    if (!value) {
        return undefined;
    }

    const normalized =
        value
            .trim()
            .toLowerCase()
            .replace(",", ".");

    const match =
        normalized.match(
            /^(\d+(?:\.\d+)?)\s*(сек|секунда|секунды|секунд|секунду|s|мин|минута|минуты|минут|минуту|m|ч|час|часа|часов|часу|h|д|день|дня|дней|дн|d)$/iu,
        );

    if (!match) {
        return undefined;
    }

    const amount =
        Number(match[1]);

    const unit =
        match[2].toLowerCase();

    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        return undefined;
    }

    if (
        [
            "сек",
            "секунда",
            "секунды",
            "секунд",
            "секунду",
            "s",
        ].includes(unit)
    ) {
        return Math.round(
            amount * 1000,
        );
    }

    if (
        [
            "мин",
            "минута",
            "минуты",
            "минут",
            "минуту",
            "m",
        ].includes(unit)
    ) {
        return Math.round(
            amount * 60_000,
        );
    }

    if (
        [
            "ч",
            "час",
            "часа",
            "часов",
            "часу",
            "h",
        ].includes(unit)
    ) {
        return Math.round(
            amount * 3_600_000,
        );
    }

    if (
        [
            "д",
            "день",
            "дня",
            "дней",
            "дн",
            "d",
        ].includes(unit)
    ) {
        return Math.round(
            amount * 86_400_000,
        );
    }

    return undefined;
}