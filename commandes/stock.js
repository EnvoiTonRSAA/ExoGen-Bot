const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stock")
    .setDescription("Voir le stock gratuit"),
  async execute(interaction) {

    const files = fs
      .readdirSync("./basic stock/")
      .filter((file) => file.endsWith(".txt"));


    const stock = {};

    files.forEach((file) => {
      const filePath = `./basic stock/${file}`;
      const data = fs.readFileSync(filePath, "utf-8");
      const lines = data.split("\n").filter(line => line.trim() !== "");
      const count = lines.length > 0 ? lines.length : 0;
      stock[file.replace(".txt", "")] = count;
    });

    const embed = new MessageEmbed()
      .setTitle("Free Stock:")
      .setImage("https://share.creavite.co/665678d0520faf7ee10a6e75.gif")
      .setColor("GREEN");

    let description = "";
    for (const [fileName, count] of Object.entries(stock)) {
      let color;

      if (count === 0) {
        color = "";
      } else if (count >= 1 && count < 25) {
        color = "";
      } else {
        color = "";
      }

      description += `${color} ${fileName}: ${count}\n`;
    }
    embed.setDescription(`\`\`\`${description}\`\`\`\n`);



















    
    interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
