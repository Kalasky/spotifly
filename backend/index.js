require('dotenv').config()

// twitch imports
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

app.get('/', (req, res) => {
  res.send('Access token and refresh token successfully refreshed! You can close this window now.')
})

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`)
})

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('DATABASE CONNECTED'))
  .catch((e) => console.log('DB CONNECTION ERROR: ', e))

// twitch commands
const {
  currentSongCommand,
  eventSubListCommand,
  rewardsCommand,
  dumpEventSubsCommand,
  createEventSubCommand,
  createDefaultChannelRewards,
  getStreamerData,
  songDurationCommand,
  blacklistCommand,
  unblacklistCommand,
  addToPlaylistCommand,
  removeSongFromPlaylistCommand,
  clearPlaylistCommand,
  deletePlaylistCommand,
  showPlaylistsCommand
} = require('./utils/tmiUtils')

currentSongCommand()
eventSubListCommand()
rewardsCommand()
dumpEventSubsCommand()
createEventSubCommand()
createDefaultChannelRewards()
getStreamerData()
songDurationCommand()
blacklistCommand()
unblacklistCommand()
addToPlaylistCommand()
removeSongFromPlaylistCommand()
clearPlaylistCommand()
deletePlaylistCommand()
showPlaylistsCommand()
