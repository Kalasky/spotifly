const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()

const sendMessage = (message) => {
    twitchClient.say(process.env.TWITCH_CHANNEL, message)
}

module.exports = {
  sendMessage
}