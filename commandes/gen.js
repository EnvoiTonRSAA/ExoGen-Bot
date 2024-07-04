const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { bgen_channel } = require('../config.json');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./cooldowns.db');


const roleQuotas = {
    '1248059775401594910': 5,   // 1 invitation
    '1213868239591968788': 10,  // 2 invitations
    '1212744002848432128': 15,  // 3 invitations
    '1212898587122343977': 25,  // 4 invitations
    '1211326310723616810': 35,  // 5 invitations
    '1211064205591978044': 50   // 6+ invitations
};

const services = [
    { name: 'adn', value: 'adn.txt' },
    { name: 'canalplus', value: 'canalplus.txt' },
    { name: 'tf1', value: 'tf1.txt' },
    { name: 'crunchyroll', value: 'crunchyroll.txt' },
    { name: 'molotov.tv', value: 'molotovtv.txt' },
    { name: 'zapsurvey', value: 'zapsurvey.txt' },
    { name: 'sfr', value: 'sfr.txt' },
    { name: 'xnxx', value: 'xnxx.txt' },
    { name: 'ubisoft', value: 'ubisoft.txt' },
    { name: 'callofduty', value: 'callofduty.txt' },
    { name: 'geoguessr', value: 'geoguessr.txt' },
    { name: 'nocibe', value: 'nocibe.txt' },
    { name: 'ufc', value: 'ufc.txt' },
    { name: 'picard', value: 'picard.txt' },
    { name: 'steam', value: 'steam.txt' },
    { name: 'xvideo', value: 'xvideo.txt' },
    { name: 'chess.com', value: 'chess.Com.txt' },
    { name: 'ubisoft', value: 'ubisoft.txt' },
    { name: 'speedburger', value: 'speedburger.txt' },
    { name: 'easycash', value: 'easycash.txt' },
    { name: 'otacos', value: 'otacos.txt' },
    { name: 'valorant', value: 'valorant.txt' },
    { name: 'funimation', value: 'funimation.txt' },
    { name: 'micromania', value: 'micromania.txt' },
    { name: 'tunnelbear', value: 'tunelbear.txt' },
];

function getUserQuota(roles) {
    let maxQuota = 3; 
    roles.forEach(role => {
        if (roleQuotas[role.id] && roleQuotas[role.id] > maxQuota) {
            maxQuota = roleQuotas[role.id];
        }
    });
    return maxQuota;
}

function resetUserQuota(userId) {
    const currentTime = Date.now();
    db.run("UPDATE cooldowns SET generationCount = 0, lastQuotaReset = ? WHERE userId = ?", [currentTime, userId], (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Quota reset for user ${userId}`);
        }
    });
}

function checkAndUpdateQuota(userId, roles, callback) {
    db.get("SELECT lastQuotaReset, generationCount, lastSuccessfulGeneration FROM cooldowns WHERE userId = ?", [userId], (err, row) => {
        if (err) {
            console.error(err);
            return;
        }

        const currentTime = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const twoMinutes = 2 * 60 * 1000;

        if (!row) {
            db.run("INSERT INTO cooldowns (userId, lastQuotaReset, lastSuccessfulGeneration, generationCount) VALUES (?, ?, ?, 0)", [userId, currentTime, 0], (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                callback(0, getUserQuota(roles), true);
            });
        } else {
            const lastQuotaReset = row.lastQuotaReset;
            const lastSuccessfulGeneration = row.lastSuccessfulGeneration;
            const generationCount = row.generationCount;

            if (currentTime - lastQuotaReset >= oneDay) {
                resetUserQuota(userId);
                callback(0, getUserQuota(roles), true);
            } else if (currentTime - lastSuccessfulGeneration < twoMinutes) {
                const remainingTime = Math.ceil((lastSuccessfulGeneration + twoMinutes - currentTime) / 1000);
                callback(generationCount, getUserQuota(roles), false, remainingTime);
            } else {
                callback(generationCount, getUserQuota(roles), true);
            }
        }
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gen')
        .setDescription('Générer un compte gratuit')
        .addStringOption(option =>
            option.setName('service')
                .setDescription('Le service à générer')
                .setRequired(true)
                .addChoices(...services.map(service => ({ name: service.name, value: service.value })))
        ),

    async execute(interaction) {
        if (bgen_channel && interaction.channelId !== bgen_channel) {
            return interaction.reply({ content: `Veuillez exécuter la commande dans <#${bgen_channel}>.`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const serviceOption = interaction.options.getString('service');
        const serviceName = services.find(service => service.value === serviceOption).name;
        const fileName = serviceOption.toLowerCase();
        const filePath = `./basic stock/${fileName}`;

        if (!fileName) {
            return interaction.editReply({ content: 'Veuillez spécifier un service à générer.' });
        }

        if (!fs.existsSync(filePath)) {
            return interaction.editReply({ content: 'Le service demandé n\'existe pas.' });
        }

        function generateAccount() {
            const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

            const randomIndex = Math.floor(Math.random() * lines.length);
            const randomLine = lines[randomIndex];

            console.log('Compte Généré:', randomLine);

            if (lines.length === 0 || !randomLine || !randomLine.trim()) {
                console.log('Le fichier est vide ou randomLine est vide.');
                return interaction.editReply({ content: 'Le service demandé est en rupture de stock. rendez-vous ici <#1251548917930131536>' });
            }

            lines.splice(randomIndex, 1);
            fs.writeFileSync(filePath, lines.join('\n'));

            const [username, password] = randomLine.split(':');

            const embedAccount = new MessageEmbed()
                .setTitle(`ExoGen™`)
                .setDescription(``)
                .addFields(
                    { name: 'Service:', value: serviceName, inline: false },
                    { name: 'ID:', value: `\`\`\`${username}\`\`\``, inline: true },
                    { name: 'Password:', value: `\`\`\`${password}\`\`\``, inline: true },
                    { name: 'Combo:', value: `\`\`\`${username}:${password}\`\`\`` }
                )
                .setImage("https://share.creavite.co/665678d0520faf7ee10a6e75.gif")
                .setColor("GREEN");

            interaction.user.send({ embeds: [embedAccount] })
                .then(() => {
                    const currentTime = Date.now();
                    db.run("UPDATE cooldowns SET generationCount = generationCount + 1, lastSuccessfulGeneration = ? WHERE userId = ?", [currentTime, interaction.user.id], (err) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        db.get("SELECT generationCount FROM cooldowns WHERE userId = ?", [interaction.user.id], (err, row) => {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            const generationCount = row ? row.generationCount : 0;

                            const embedSuccess = new MessageEmbed()
                                .setTitle(`Compte Généré`)
                                .setDescription(`\`\`⭐️\`\` **Votre compte pour le service **${serviceName}** a été généré avec succès ! Vérifiez vos messages privés. \n [vous ne pouvez pas ecrire ?](https://discord.gg/Cyd8KnmW)**\n\n\`\`\`Vous avez généré ${generationCount} comptes.\`\`\``)
                                .setThumbnail("")
                                .setImage("https://share.creavite.co/665678c2520faf7ee10a6e74.gif")
                                .setColor("GREEN");

                            interaction.editReply({ embeds: [embedSuccess] });
                        });
                    });
                })
                .catch(error => {
                    console.error(`Erreur d'envoi par message direct: ${error}`);
                    return interaction.editReply({ content: 'Échec de l\'envoi des détails du compte par message direct.' });
                });
        }

        const userRoles = interaction.member.roles.cache;

        checkAndUpdateQuota(interaction.user.id, userRoles, (generationCount, userQuota, canGenerate, remainingTime) => {
            if (!canGenerate) {
                return interaction.editReply({ content: `Veuillez attendre ${remainingTime} secondes avant de générer à nouveau.` });
            }

            if (generationCount >= userQuota) {
                return interaction.editReply({ content: `Vous avez atteint votre quota de génération de compte pour aujourd'hui. Vous avez généré ${generationCount} comptes sur ${userQuota} permis.**Afin d'augmenter ton quota par jour, tu peux aller consulter ce salon : <#1245556283826901024> ,  ou alors acquérir le VIP ici : <#1251548917930131536>**` });
            }

            generateAccount();
        });
    },
};