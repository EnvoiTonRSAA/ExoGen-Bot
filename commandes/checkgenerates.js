const { SlashCommandBuilder } = require('@discordjs/builders');
const sqlite3 = require('sqlite3').verbose();

const basicDB = new sqlite3.Database('./cooldowns.db');
const premiumDB = new sqlite3.Database('./pcooldowns.db');

const generators = [
    { name: 'Free gen', value: 'basic' },
    { name: 'Premium gen', value: 'premium' }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('checkgenerates')
        .setDescription('Check the number of generations')
        .addStringOption(option =>
            option.setName('generator')
                .setDescription('The generator to check generations')
                .setRequired(true)
                .addChoices(...generators)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check generations')
        ),

    async execute(interaction) {
        const generator = interaction.options.getString('generator');
        const user = interaction.options.getUser('user') || interaction.user;
        const userId = user.id;

        let db;
        if (generator === 'basic') {
            db = basicDB;
        } else if (generator === 'premium') {
            db = premiumDB;
        } else {
            return interaction.reply({ content: 'Invalid generator type specified.', ephemeral: true });
        }
        db.get("SELECT generationCount FROM cooldowns WHERE userId = ?", [userId], (err, row) => {
            if (err) {
                console.error(err);
                return interaction.reply({ content: 'An error occurred while fetching data.', ephemeral: true });
            }

            if (!row) {
                const response = `<@${userId}> Tu n'as pas encore généré de compte sur ce générateur..`;
                return interaction.reply(response);
            }

            const generationCount = row.generationCount;
            const response = `<@${userId}> a généré ${generationCount} compte avec ce générateur.`;
            interaction.reply(response);
        });
    },
};
