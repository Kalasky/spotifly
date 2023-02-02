require('dotenv').config()

// twitch imports
const twitchUtils = require('./utils/twitchUtils')
const { currentSong } = require('./utils/spotifyUtils')
const { twitchRefreshAccessTokenMiddleware } = require('./middleware/twitchRefreshHandler')

// spotify imports
const { spotifyRefreshAccessTokenMiddleware } = require('./middleware/spotifyRefreshHandler')

const refreshMiddleware = async (req, res, next) => {
  await spotifyRefreshAccessTokenMiddleware(req, res, next)
  await twitchRefreshAccessTokenMiddleware(req, res, next)
}

// database imports
const mongoose = require('mongoose')

// express imports
const express = require('express')
const cors = require('cors')
const PORT = process.env.PORT || 8888
const app = express()

// middleware
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cors()) // enable CORS for all routes
app.use(express.raw({ type: 'application/json' }))

// routes
const twitchRoutes = require('./routes/twitchRoutes.js')
const spotifyRoutes = require('./routes/spotifyRoutes.js')
const eventSubRoutes = require('./routes/eventSubRoutes.js')

app.use('/api', [twitchRoutes, spotifyRoutes])
app.use('/events', refreshMiddleware, eventSubRoutes)

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('DATABASE CONNECTED'))
  .catch((e) => console.log('DB CONNECTION ERROR: ', e))

// twitch commands
const { commandListener, adminCommandListener } = require('./utils/tmiUtils')
const { dumpEventSubs, getAllRewards, eventSubList } = require('./utils/twitchUtils')

// !nowplaying will return the current song playing from your spotify account
commandListener('!nowplaying', currentSong)
// you must run the !dump command after every stream
adminCommandListener('!dump', dumpEventSubs)
// !rewards will return a list of all rewards for the broadcaster, this is useful for getting the reward id
adminCommandListener('!rewards', getAllRewards)
// !eventsubs will return a list of all enabled (active) eventsub subscriptions for the broadcaster
adminCommandListener('!eventsubs', eventSubList)

// uncomment to create your own eventsub subscription
// make sure you have the correct env variable set
// twitchUtils.createEventSub(
//   process.env.TWITCH_REWARD_ID_SPOTIFY,
// )
twitchUtils.createEventSub(
  process.env.TWITCH_REWARD_ID_SKIP_SONG,
)
// twitchUtils.createEventSub(
//   process.env.TWITCH_REWARD_ID_VOLUME,
// )
// twitchUtils.createEventSub(
//   process.env.TWITCH_REWARD_ID_PENNY,
// )
