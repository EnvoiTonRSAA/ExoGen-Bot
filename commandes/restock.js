const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const files = fs.readdirSync('./basic stock/').filter(file => file.endsWith('.txt'));

const services = files.map(file => ({
    name: file.replace('.txt', ''),
    value: file.replace('.txt', '').toLowerCase()
}));


const REQUIRED_ROLE_ID = '1246523365376917566';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restock')
        .setDescription('Restock un service gratuit')
        .addStringOption(option =>
            option.setName('service')
                .setDescription('Le service de restock')
                .setRequired(true)
                .addChoices(...services))
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('Glissez ou déposez un fichier texte ici')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
            return interaction.reply({ content: "Vous n'êtes pas autorisé à exécuter cette commande.", ephemeral: true });
        }

        const serviceOption = interaction.options.getString('service');
        const attachment = interaction.options.getAttachment('file');

        const embed = new MessageEmbed()
            .setTitle("Free restock");

        if (!attachment || !attachment.name.endsWith('.txt')) {
            return interaction.reply({ content: 'Veuillez faire glisser un fichier texte contenant des comptes.', ephemeral: true });
        }

        try {
            const response = await axios.get(attachment.url);
            const lines = response.data.split('\n');

            const existingLines = fs.readFileSync(`./basic stock/${serviceOption}.txt`, 'utf-8').split('\n');
            fs.writeFileSync(`./basic stock/${serviceOption}.txt`, [...existingLines, ...lines].join('\n'));

            embed.setDescription(`Le **${serviceOption}** service a été restock avec succès.`)
            embed.setColor("GREEN");
            interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la récupération du fichier joint:', error);
            embed.setDescription("Une erreur s'est produite lors du traitement du fichier joint.");
            interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
