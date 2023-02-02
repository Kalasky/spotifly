const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()

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

module.exports = {
  sendMessage,
  commandListener,
  adminCommandListener,
}
