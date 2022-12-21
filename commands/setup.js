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
    .setDescription('Sit tight while we link your account to our database!')
    .addStringOption(option => option.setName('username').setDescription('Your Spotify username')),
  async execute(interaction) {
    // get user info
    const spotifyId = interaction.options.getString('username')
    const discordId = interaction.user.id
    const discordUsername = interaction.user.username
    const discordDiscriminator = interaction.user.discriminator
    

    // check if user is already in database
    const user = await User.findOne({ discordId: discordId })
    if (user) {
      return interaction.reply({ content: 'You are already in our database!', ephemeral: true })
    }

    // add user to database
    const newUser = new User({
      discordId: discordId,
      discordUsername: discordUsername,
      discordDiscriminator: discordDiscriminator,
      spotifyId: spotifyId,
      spotifyFollowers: 0,
    })

    await newUser.save()

    interaction.reply({ content: 'You have been added to our database!', ephemeral: true })
  },
}
