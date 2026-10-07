import {
    ChatInputCommandInteraction,
} from "discord.js";

export async function handleHelp(
    interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> {
    await interaction.reply({
        content: [
            "**🤖 Доступные команды**",
            "",
            "💬 **Основные**",
            "`/ping` — Проверить пинг бота.",
            "`/help` — Показать список команд.",
            "`/joke` — Рассказать шутку.",
            "",
            "👤 **Профиль**",
            "`/обновить_ник` — Обновить ник.",
            "`/указать_ник` — Установить игровой ник.",
            "`/статистика` — Посмотреть свою статистику.",
        ].join("\n"),
        ephemeral: true,
    });
}