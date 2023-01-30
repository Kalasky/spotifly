require('dotenv').config()
// file system imports
const fs = require('node:fs')
const path = require('node:path')
const cron = require('node-cron')

// twitch imports
const twitchUtils = require('./utils/twitchUtils')

// local file imports
const deployCommands = require('./deploy-commands')

// database imports
const mongoose = require('mongoose')

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
app.use(express.raw({ type: 'application/json' }))
app.use('/api', cors(), express.raw({ type: 'application/json' }), twitchRoutes)
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

// uncomment to create your own eventsub subscription
// make sure you have the correct env variables set
// twitchUtils.createEventSub(
//   process.env.TWITCH_CLIENT_ID,
//   process.env.APP_ACCESS_TOKEN,
//   process.env.TWITCH_BROADCASTER_ID,
//   process.env.TWITCH_REWARD_ID_TC3,
//   process.env.NGROK_TUNNEL_URL,
//   process.env.TWITCH_WEBHOOK_SECRET
// )

// twitchUtils.dumpEventSubs(process.env.TWITCH_CLIENT_ID, process.env.APP_ACCESS_TOKEN)

// deploy global commands when bot joins a new guild
client.on(Events.GuildCreate, () => {
  deployCommands
})

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

client.login(process.env.DISCORD_TOKEN)
