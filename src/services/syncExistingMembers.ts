import { client } from "../client"

export async function syncExistingMembers(): Promise<void> {
    console.info("🔄 Starting members sync...");

    const guildId = process.env.DISCORD_GUILD_ID;

    if (!guildId) {
        throw new Error(
            "GUILD_ID is missing.",
        );
    }

    const guild =
        client.guilds.cache.get(guildId);

    if (!guild) {
        throw new Error(
            `Guild ${guildId} not found.`,
        );
    }

    console.info(
        `🏠 Guild: ${guild.name} (${guild.id})`,
    );

    console.info(
        `📦 Cached members: ${guild.members.cache.size}`,
    );

    console.info(
        "📥 Fetching members from Discord...",
    );

    const members = await Promise.race([
        guild.members.fetch(),

        new Promise<never>((_, reject) => {
            setTimeout(
                () =>
                    reject(
                        new Error(
                            "guild.members.fetch() timed out after 30 seconds.",
                        ),
                    ),
                30_000,
            );
        }),
    ]);

    console.info(
        `👥 Found ${members.size} members.`,
    );

    let addedCount = 0;
    let skippedCount = 0;
    let botCount = 0;
    let errorCount = 0;

    console.info(
        `✅ Members sync completed for ${guild.name}.`,
    );

    console.info(
        `📊 Added: ${addedCount}`,
    );

    console.info(
        `⏭️ Skipped: ${skippedCount}`,
    );

    console.info(
        `🤖 Bots: ${botCount}`,
    );

    console.info(
        `❌ Errors: ${errorCount}`,
    );
}