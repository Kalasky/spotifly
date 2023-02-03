const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()
const { searchSong } = require('./spotifyUtils')

const sendMessage = (message) => {
  twitchClient.say(process.env.TWITCH_USERNAME, message)
}

const commandListener = (command, callback) => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    if (message.toLowerCase() === command) {
      callback()
    }
  })
}

const adminCommandListener = (command, callback) => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    if (message.toLowerCase() === command && tags.username === process.env.TWITCH_USERNAME) {
      callback()
    }
  })
}

const searchSongCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'spotifysearch' || command === 'ss') {
      searchSong(args.join(' '))
    }
  })
}

module.exports = {
  sendMessage,
  commandListener,
  adminCommandListener,
  searchSongCommand,
}
