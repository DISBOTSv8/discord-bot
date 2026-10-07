import {
    Guild,
    GuildMember,
} from "discord.js";

export interface TargetMemberResult {
    member: GuildMember | null;
    ambiguous: GuildMember[];
}

export async function resolveTargetMember(
    guild: Guild,
    targetUserId: string | null,
    targetQuery: string | null,
): Promise<TargetMemberResult> {
    if (targetUserId) {
        const member =
            await guild.members
                .fetch(targetUserId)
                .catch(() => null);

        return {
            member,
            ambiguous: [],
        };
    }

    if (!targetQuery) {
        return {
            member: null,
            ambiguous: [],
        };
    }

    const query =
        normalizeName(targetQuery);

    if (!query) {
        return {
            member: null,
            ambiguous: [],
        };
    }

    const members =
        await guild.members
            .fetch()
            .catch(() => null);

    if (!members) {
        return {
            member: null,
            ambiguous: [],
        };
    }

    const exactMatches =
        members.filter(
            member =>
                getMemberNames(member).some(
                    name =>
                        normalizeName(name) ===
                        query,
                ),
        );

    if (exactMatches.size === 1) {
        return {
            member:
                exactMatches.first()!,
            ambiguous: [],
        };
    }

    if (exactMatches.size > 1) {
        return {
            member: null,
            ambiguous:
                [...exactMatches.values()],
        };
    }

    const partialMatches =
        members.filter(
            member =>
                getMemberNames(member).some(
                    name => {
                        const normalizedName =
                            normalizeName(name);

                        return (
                            normalizedName.includes(
                                query,
                            ) ||
                            query.includes(
                                normalizedName,
                            )
                        );
                    },
                ),
        );

    if (partialMatches.size === 1) {
        return {
            member:
                partialMatches.first()!,
            ambiguous: [],
        };
    }

    if (partialMatches.size > 1) {
        return {
            member: null,
            ambiguous:
                [...partialMatches.values()],
        };
    }

    const similarMatches =
        members.filter(
            member =>
                getMemberNames(member).some(
                    name =>
                        isSimilarName(
                            normalizeName(name),
                            query,
                        ),
                ),
        );

    if (similarMatches.size === 1) {
        return {
            member:
                similarMatches.first()!,
            ambiguous: [],
        };
    }

    if (similarMatches.size > 1) {
        return {
            member: null,
            ambiguous:
                [...similarMatches.values()],
        };
    }

    return {
        member: null,
        ambiguous: [],
    };
}

function getMemberNames(
    member: GuildMember,
): string[] {
    return [
        member.displayName,
        member.user.username,
        member.user.globalName,
    ].filter(
        (
            name,
        ): name is string =>
            Boolean(name),
    );
}

function normalizeName(
    value: string,
): string {
    return value
        .trim()
        .toLowerCase()
        .replace(
            /[()[\]{}]/g,
            "",
        )
        .replace(
            /[_|]+/g,
            " ",
        )
        .replace(
            /\s+/g,
            " ",
        )
        .trim();
}

function isSimilarName(
    name: string,
    query: string,
): boolean {
    if (
        !name ||
        !query
    ) {
        return false;
    }

    if (
        name.length < 3 ||
        query.length < 3
    ) {
        return false;
    }

    if (
        name.startsWith(query) ||
        query.startsWith(name)
    ) {
        return true;
    }

    const distance =
        levenshteinDistance(
            name,
            query,
        );

    const maxLength =
        Math.max(
            name.length,
            query.length,
        );

    return (
        distance <= 2 ||
        (
            maxLength >= 7 &&
            distance <= 3
        )
    );
}

function levenshteinDistance(
    first: string,
    second: string,
): number {
    const previous =
        Array.from(
            {
                length:
                    second.length + 1,
            },
            (_, index) => index,
        );

    for (
        let i = 1;
        i <= first.length;
        i++
    ) {
        const current = [
            i,
        ];

        for (
            let j = 1;
            j <= second.length;
            j++
        ) {
            const insert =
                current[j - 1] + 1;

            const remove =
                previous[j] + 1;

            const replace =
                previous[j - 1] +
                (
                    first[i - 1] ===
                    second[j - 1]
                        ? 0
                        : 1
                );

            current.push(
                Math.min(
                    insert,
                    remove,
                    replace,
                ),
            );
        }

        for (
            let j = 0;
            j < current.length;
            j++
        ) {
            previous[j] =
                current[j];
        }
    }

    return previous[
        second.length
        ];
}