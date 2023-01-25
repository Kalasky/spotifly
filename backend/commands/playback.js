require("dotenv").config()
const utils = require("../utils/spotifyUtils")
const User = require("../models/User")
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require("discord.js")
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
    .setName("playback")
    .setDescription("Control your playback!")
    .addSubcommand((subcommand) => subcommand.setName("pause").setDescription("Pause your current song."))
    .addSubcommand((subcommand) => subcommand.setName("resume").setDescription("Resume your current song.")),

  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id })
    // if user is not in database and has not authorized their account
    if (user === null && user.spotifyAccessToken === "") {
      interaction.reply({
        content:
          "You have not authorized your account yet! Please run the /setup command and follow the instructions.",
        ephemeral: true,
      })
      return
    }

    // pause playback
    try {
      if (interaction.options.getSubcommand() === "pause") {
        utils.pauseSong(user.spotifyId, user.spotifyAccessToken, user.spotifyRefreshToken)
        interaction.reply({
          content: "Playback has been paused.",
          ephemeral: true,
        })
        return
      }
    } catch (error) {
      console.log(error)
    }

    // resume playback
    if (interaction.options.getSubcommand() === "resume") {
      utils.resumeSong(user.spotifyId, user.spotifyAccessToken, user.spotifyRefreshToken)
      interaction.reply({
        content: "Playback has been resumed.",
        ephemeral: true,
      })
      return
    }
  },
}
