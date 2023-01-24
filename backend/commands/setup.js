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
    .setDescription('Initiate the setup process! This will add you to our database and allow you to use our bot!')
    .addStringOption((option) => option.setName('spotifyusername').setDescription('Your SPOTIFY username.'))
    .addStringOption((option) => option.setName('twitchusername').setDescription('Your TWITCH password.')),
  async execute(interaction) {
    // get user info
    const spotifyId = interaction.options.getString('spotifyusername')
    const twitchId = interaction.options.getString('twitchusername')
    const discordId = interaction.user.id
    const discordUsername = interaction.user.username
    const discordDiscriminator = interaction.user.discriminator

    // check if user is already in database
    const user = await User.findOne({ discordId: discordId })

    // update their spotifyId if they are already in the database but haven't authorized their account
    if (user && user.accessToken === '') {
      user.spotifyId = spotifyId
      await user.save()
      return interaction.reply({
        content:
          'Your Spotify ID has been updated!\nConfirm your Spotify identity by authorizing your account here: localhost:8888/api/login',
        ephemeral: true,
      })
    }

    if (user === null) {
      // add user to database
      const newUser = new User({
        discordId: discordId,
        discordUsername: discordUsername,
        discordDiscriminator: discordDiscriminator,
        spotifyId: spotifyId,
        twitchId: twitchId,
        spotifyFollowers: 0,
        isPremium: false,
        authorized: false,
        accessToken: '',
        refreshToken: '',
      })

      await newUser.save()

      // once user is added to database, send them a link to authorize their account
      interaction.reply({
        content:
          'You have been added to our database!\nConfirm your Spotify identity by authorizing your account here: localhost:8888/api/login',
        ephemeral: true,
      })
    }

    if (user !== null && user.accessToken !== '') {
      interaction.reply({
        content: 'You are already authenticated and have full access to our bot!',
        ephemeral: true,
      })
    }
  },
}
