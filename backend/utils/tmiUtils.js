const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()
const { searchSong } = require('./spotifyUtils')
const { createEventSub, getAllRewards, dumpEventSubs, eventSubList } = require('./twitchUtils')
const { currentSong } = require('./spotifyUtils')

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

const createEventSubCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'createeventsub' || (command === 'ces' && tags.username === process.env.TWITCH_USERNAME)) {
      createEventSub(process.env.TWITCH_REWARD_ID_SPOTIFY)
      createEventSub(process.env.TWITCH_REWARD_ID_SKIP_SONG)
      createEventSub(process.env.TWITCH_REWARD_ID_VOLUME)
      createEventSub(process.env.TWITCH_REWARD_ID_PENNY)
    }
  })
}

const dumpEventSubsCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'dumpeventsubs' || (command === 'des' && tags.username === process.env.TWITCH_USERNAME)) {
      dumpEventSubs()
    }
  })
}

const rewardsCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'rewards' || (command === 'r' && tags.username === process.env.TWITCH_USERNAME)) {
      getAllRewards()
    }
  })
}

const eventSubListCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'eventsublist' || (command === 'esl' && tags.username === process.env.TWITCH_USERNAME)) {
      eventSubList()
    }
  })
}

const currentSongCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'currentsong' || command === 'cs' || command === 'song' || command === 'nowplaying' || command === 'np') {
      currentSong()
    }
  })
}

module.exports = {
  currentSongCommand,
  eventSubListCommand,
  rewardsCommand,
  dumpEventSubsCommand,
  searchSongCommand,
  createEventSubCommand,
}
