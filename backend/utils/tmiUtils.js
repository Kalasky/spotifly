const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()
const { searchSong } = require('./spotifyUtils')
const { createEventSub, getAllRewards, dumpEventSubs, eventSubList, createReward, getUser } = require('./twitchUtils')
const { currentSong } = require('./spotifyUtils')
const User = require('../models/User')

// utils
const updateSongDurationLimit = async (newDuration) => {
  try {
    const user = await User.findOneAndUpdate(
      { twitchUsername: process.env.TWITCH_USERNAME },
      { $set: { songDurationLimit: newDuration } },
      { new: true }
    )
    return user
  } catch (error) {
    console.log(error)
  }
}

const removeFromBlacklist = async (username) => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  // find the index of the username in the blacklist array
  const index = user.blacklist.indexOf(username)
  if (index > -1) {
    user.blacklist.splice(index, 1)
    console.log(`Removed ${username} from the blacklist`)
    await user.save()
  }
}

const addToBlacklist = async (username) => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  user.blacklist.push(username)
  console.log(`Added ${username} to the blacklist`)
  await user.save()
}

// commands
const blacklistCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'blacklist' && tags.username === process.env.TWITCH_USERNAME) {
      addToBlacklist(args[0])
      twitchClient.say(process.env.TWITCH_USERNAME, `Added ${args[0]} to the blacklist.`)
    }
  })
}

const unblacklistCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const args = message.slice(1).split(' ')
    const command = args.shift().toLowerCase()

    if (command === 'unblacklist' && tags.username === process.env.TWITCH_USERNAME) {
      removeFromBlacklist(args[0])
      twitchClient.say(process.env.TWITCH_USERNAME, `Removed ${args[0]} from the blacklist.`)
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
      createReward(
        'Change Song Volume',
        'Enter any number between 0 and 100 to change the volume of the current song.',
        500,
        '#43C4EB',
        true,
        false,
        0
      )
      createReward(
        'Drop a penny in the well!',
        'Every time this reward is redeemed, the cost will increase in value by 1 channel point.',
        1,
        '#77FF83',
        false,
        false,
        0
      )
      createReward('Song Submission', 'Submit a spotify *song link* directly to the queue! ', 250, '#392e5c', true, true, 30)
    }
  })
}

let maxDuration = 600000

const songDurationCommand = () => {
  twitchClient.on('message', (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    const newDuration = parseInt(message.slice(1).split(' ')[1])
    if (command === 'songduration' || (command === 'sd' && tags.username === process.env.TWITCH_USERNAME)) {
      if (!isNaN(newDuration) && newDuration > 0) {
        maxDuration = newDuration * 1000 // convert to milliseconds
        updateSongDurationLimit(maxDuration)
        twitchClient.say(process.env.TWITCH_USERNAME, `Song duration has been set to ${newDuration} seconds.`)
      } else {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a valid number of seconds.`)
      }
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
  getStreamerData,
  songDurationCommand,
  blacklistCommand,
  unblacklistCommand,
}
