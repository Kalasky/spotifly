require('dotenv').config()
// file system imports
const fs = require('node:fs')
const path = require('node:path')
const cron = require('node-cron')
const twitchUtils = require('./utils/twitchUtils')
const spotifyUtils = require('./utils/spotifyUtils')

// twitch imports
const tmi = require('tmi.js')

// local file imports
const deployCommands = require('./deploy-commands')

// database imports
const mongoose = require('mongoose')
const User = require('./models/User')

// discord imports
const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js')
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
client.commands = new Collection()
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'))

// express imports
const express = require('express')
const cors = require('cors')
const PORT = process.env.PORT || 8888
const app = express()

// middleware
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cors()) // enable CORS for all routes

// routes
const spotifyRoutes = require('./routes/spotifyRoutes.js')
const twitchRoutes = require('./routes/twitchRoutes.js')
app.use('/api', cors(), twitchRoutes)
app.use('/api', cors(), spotifyRoutes)

app.get('/', (req, res) => {
  res.send(
    'You have been successfully authenticated! You can now close this window. Enjoy all the features of the Spotifly Discord bot!'
  )
})

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file)
  const command = require(filePath)
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command)
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
  }
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('DATABASE CONNECTED'))
  .catch((e) => console.log('DB CONNECTION ERROR: ', e))

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  const command = interaction.client.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  client.user.setUsername(process.env.BOT_NAME)

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    })
  }
})

const twitchClient = new tmi.Client({
  options: { debug: true },
  channels: [process.env.TWITCH_CHANNEL],
  connection: { reconnect: true },
  identity: {
    username: process.env.TWITCH_BOT_USERNAME,
    password: process.env.TWITCH_BOT_TOKEN,
  },
})

twitchClient.connect()

twitchClient.on('message', async (channel, tags, message, self) => {
  if (self) return
})

const getNewRedemptionEvents = async () => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
  const twitchAccessToken = user.twitchAccessToken
  const twitch_username = user.twitchId


  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=${process.env.TWITCH_REWARD_ID}&status=UNFULFILLED`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${twitchAccessToken}`,
        },
      }
    )

    const data = await res.json()
    console.log(data)
    if (data.data.length > 0) {
      const initialTrackLink = data.data[0].user_input
      const trackId = initialTrackLink.substring(initialTrackLink.lastIndexOf('/') + 1, initialTrackLink.indexOf('?'))
      const trackLink = 'spotify:track:' + trackId
      console.log(trackLink)

      const twitchId = process.env.TWITCH_CHANNEL
      const id = data.data[0].id
      const user = await User.findOne({ twitchId })
      const spotifyAccessToken = user.spotifyAccessToken
      const spotifyRefreshToken = user.spotifyRefreshToken
      const spotify_username = user.spotifyId
      spotifyUtils.addToQueue(spotify_username, spotifyAccessToken, spotifyRefreshToken, trackLink)

      // update reward status to fulfilled after adding to queue
      twitchUtils.fulfillTwitchReward(
        twitch_username,
        twitchAccessToken,
        process.env.TWITCH_CLIENT_ID,
        process.env.TWITCH_BROADCASTER_ID,
        process.env.TWITCH_REWARD_ID,
        id
      )
    }
  } catch (error) {
    console.log(error)
  }
}

cron.schedule('* * * * *', () => {
  getNewRedemptionEvents()
})

// deploy global commands when bot joins a new guild
client.on(Events.GuildCreate, () => {
  deployCommands
})

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

client.login(process.env.DISCORD_TOKEN)
