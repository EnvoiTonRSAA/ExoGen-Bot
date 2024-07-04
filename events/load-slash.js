const fs = require("fs");
const path = require("path");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const config = require("../config.json");

async function loadSlashCommands(client) {
    try {
        const commandsDir = path.resolve(__dirname, "../commandes");
        const commandFiles = fs
            .readdirSync(commandsDir)
            .filter((file) => file.endsWith(".js"));

        const commands = [];
        const loadedCommands = {};

        for (const file of commandFiles) {
            const command = require(`${commandsDir}/${file}`);

            // Vérifiez que command et command.data sont définis
            if (!command || !command.data || typeof command.data.toJSON !== 'function') {
                console.warn(`Le fichier de commande '${file}' n'a pas de propriété 'data' valide avec une méthode 'toJSON'. Ignoré.`);
                continue;
            }

            const commandData = command.data.toJSON();
            if (!loadedCommands[commandData.name]) {
                commands.push(commandData);
                loadedCommands[commandData.name] = true;
            } else {
                console.warn(`La commande '${commandData.name}' est déjà chargée. Ignorée.`);
            }
        }

        const rest = new REST({ version: '9' }).setToken(config.bot_token);

        console.log('Chargement des commandes...');

        await rest.put(
            Routes.applicationGuildCommands(config.client_id, config.server_id),
            { body: commands },
        );

        console.log('Commandes chargées avec succès !');
    } catch (error) {
        console.error("Une erreur s'est produite :", error);
    }
}

module.exports = { loadSlashCommands };