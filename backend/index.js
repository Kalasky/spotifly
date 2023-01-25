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
const User = require('./models/User')
const { sendMessage } = require('./utils/tmiUtils')
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

const textCreation3 = async () => {
  const chance = Math.random()
  const modChance = 0.009
  const vipChance = 0.006
  const banChance = 0.02
  const timedOutChance = 0.08

  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
  const res = await fetch(
    `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=68f6ed85-0cb1-4498-a360-d11f95f1caea&status=UNFULFILLED`,
    {
      method: 'GET',
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${user.twitchAccessToken}`,
      },
    }
  )
  const data = await res.json()
  if (data.data.length > 0) {
    const username = data.data[0].user_login

    switch (true) {
      case chance <= modChance:
        sendMessage(`@${username} has won the 0.05 chance to become a moderator for the channel!`)
        break
      case chance <= vipChance:
        sendMessage(`@${username} has won the 0.07 chance to become a VIP!`)
        break
      case chance <= banChance:
        sendMessage(`@${username} has earned themselves a 1 hour ban!`)
        break
      case chance <= timedOutChance:
        sendMessage(`@${username} has earned themselves a timeout of 30 minutes!`)
        break
      default:
        sendMessage(`@${username} None of the chances were met, try again!`)
        break
    }

    // update the status of the redemption to fulfilled
    twitchUtils.fulfillTwitchReward(
      process.env.TWITCH_CHANNEL,
      user.twitchAccessToken,
      user.twitchRefreshToken,
      process.env.TWITCH_CLIENT_ID,
      process.env.TWITCH_BROADCASTER_ID,
      '68f6ed85-0cb1-4498-a360-d11f95f1caea',
      data.data[0].id
    )
  }
}

cron.schedule('*/10 * * * * *', () => {
  textCreation3()
})

// get new redemption events every 10 seconds
cron.schedule('*/10 * * * * *', () => {
  twitchUtils.getNewRedemptionEvents(
    process.env.TWITCH_CHANNEL,
    process.env.TWITCH_CLIENT_ID,
    process.env.TWITCH_BROADCASTER_ID,
    process.env.TWITCH_REWARD_ID
  )
})

// deploy global commands when bot joins a new guild
client.on(Events.GuildCreate, () => {
  deployCommands
})

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

client.login(process.env.DISCORD_TOKEN)
