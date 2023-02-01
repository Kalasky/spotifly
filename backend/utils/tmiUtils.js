const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()

const sendMessage = (message) => {
  twitchClient.say(process.env.TWITCH_CHANNEL, message)
}

const commandListener = (command, callback) => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    if (message.toLowerCase() === command) {
      callback()
    }
  })
}

module.exports = {
  sendMessage,
  commandListener,
}
