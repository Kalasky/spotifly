require("dotenv").config();
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
})

module.exports = {
  data: new SlashCommandBuilder()
    .setName("command_name")
    .setDescription("Command Description")
    .addStringOption((option) =>
    option.setName('input').setDescription('option description').setRequired(true)
  ),
  async execute(interaction) { 
    // code goes here
  },
};
