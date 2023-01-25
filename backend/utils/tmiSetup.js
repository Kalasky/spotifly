const tmi = require('tmi.js')

const setupTwitchClient = () => {
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
  return twitchClient
}

module.exports = {
  setupTwitchClient,
}
