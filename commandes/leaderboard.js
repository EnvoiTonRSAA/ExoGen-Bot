const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();

const basicDB = new sqlite3.Database('./cooldowns.db');
const premiumDB = new sqlite3.Database('./pcooldowns.db');

const generators = [
    { name: 'Free gen', value: 'basic' },
    { name: 'Premium gen', value: 'premium' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Show the top users by number of generations')
        .addStringOption(option =>
            option.setName('generator')
                .setDescription('The generator to check the leaderboard for')
                .setRequired(true)
                .addChoices(...generators)
        ),

    async execute(interaction) {
        const generator = interaction.options.getString('generator');

        let db;
        if (generator === 'basic') {
            db = basicDB;
        } else if (generator === 'premium') {
            db = premiumDB;
        } else {
            return interaction.reply({ content: 'Invalid generator type specified.', ephemeral: true });
        }

        db.all("SELECT userId, generationCount FROM cooldowns ORDER BY generationCount DESC LIMIT 100", (err, rows) => {
            if (err) {
                console.error(err);
                return interaction.reply({ content: 'An error occurred while fetching data.', ephemeral: true });
            }

            if (rows.length === 0) {
                return interaction.reply('No users have generated accounts with this generator yet.');
            }

            const perPage = 10;
            let page = 0;

            const generateEmbed = (start) => {
                const current = rows.slice(start, start + perPage);

                const embed = new MessageEmbed()
                    .setTitle('🏆 Leaderboard des utilisateurs avec le plus de générations 🏆')
                    .setColor('#FFD700');

                current.forEach((row, index) => {
                    embed.addField(`#${start + index + 1}`, `<@${row.userId}> avec **${row.generationCount}** générations`, true);
                });

                return embed;
            };

            const embedMessage = generateEmbed(0);

            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId('prev')
                        .setLabel('Précédent')
                        .setStyle('SECONDARY'),
                    new MessageButton()
                        .setCustomId('next')
                        .setLabel('Suivant')
                        .setStyle('SECONDARY')
                );

            interaction.reply({ embeds: [embedMessage], components: [row] });

            const filter = (i) => i.customId === 'prev' || i.customId === 'next';
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev' && page > 0) {
                    page--;
                } else if (i.customId === 'next' && (page + 1) * perPage < rows.length) {
                    page++;
                }

                await i.update({ embeds: [generateEmbed(page * perPage)], components: [row] });
            });

            collector.on('end', () => {
                const disabledRow = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('prev')
                            .setLabel('Précédent')
                            .setStyle('SECONDARY')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('next')
                            .setLabel('Suivant')
                            .setStyle('SECONDARY')
                            .setDisabled(true)
                    );
                interaction.editReply({ components: [disabledRow] });
            });
        });
    },
};
