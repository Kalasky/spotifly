const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()
const { searchSong } = require('./spotifyUtils')
const { createEventSub, getAllRewards, dumpEventSubs, eventSubList, createReward, getUser } = require('./twitchUtils')
const { currentSong } = require('./spotifyUtils')

const searchSongCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'spotifysearch' || command === 'ss') {
      searchSong(args.join(' '))
    }

    if (command === 'ss' && args.length === 0) {
      twitchClient.say(process.env.TWITCH_USERNAME, 'Please enter a track name to search for i.e. !ss bad habit.')
    }
  })
}

const getStreamerData = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'me' && tags.username === process.env.TWITCH_USERNAME) {
      getUser()
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

const createDefaultChannelRewards = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'defaultrewards' || (command === 'dr' && tags.username === process.env.TWITCH_USERNAME)) {
      createReward('Skip Song', 'Skip the current song', 1000, '#F33A22', false, false, 0)
      createReward('Change Song Volume', 'Enter any number between 0 and 100 to change the volume of the current song.', 500, '#43C4EB', true, false, 0)
      createReward('Drop a penny in the well!', 'Every time this reward is redeemed, the cost will increase in value by 1 channel point.', 1, '#77FF83', false, false, 0)
      createReward('Song Submission', 'Submit a spotify *song link* directly to the queue! ', 250, '#392e5c', true, true, 30)
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
  createDefaultChannelRewards,
  getStreamerData
}
