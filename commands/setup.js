require('dotenv').config()
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js')
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
})
const User = require('../models/User')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Sit tight while we link your account to our database!'),
  async execute(interaction) {},
}
