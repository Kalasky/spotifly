const twitchClientSetup = require('./tmiSetup')
const twitchClient = twitchClientSetup.setupTwitchClient()
const { createEventSub, getAllRewards, dumpEventSubs, eventSubList, createReward, getUser } = require('./twitchUtils')
const {
  currentSong,
  addTracksToPlaylist,
  searchSong,
  removeTracksFromPlaylist,
  clearPlaylist,
  deletePlaylist,
  showPlaylists,
} = require('./spotifyUtils')
const User = require('../models/User')

// middleware
const { twitchHandler } = require('../middleware/twitchRefreshHandler')
const { spotifyHandler } = require('../middleware/spotifyRefreshHandler')

const refreshMiddleware = async () => {
  await twitchHandler()
  await spotifyHandler()
}

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

const getTrack = async (query) => {
  await refreshMiddleware()
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  try {
    const getTrack = await fetch(`https://api.spotify.com/v1/tracks/${query}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
      },
    })
    const track = await getTrack.json()
    return track
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
  // if user is already in the blacklist, return
  if (user.blacklist.includes(username)) {
    twitchClient.say(process.env.TWITCH_USERNAME, `User is already blacklisted.`)
    return
  } else {
    user.blacklist.push(username)
    console.log(`Added ${username} to the blacklist`)
  }
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

const addToPlaylistCommand = async () => {
  await refreshMiddleware()
  twitchClient.on('message', async (channel, tags, message, self) => {
    let trackId
    let newLink
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    const playlist = message.slice(1).split(' ')[1]
    const song = message.slice(1).split(' ').slice(2).join(' ')
    if (command === 'addtoplaylist' || command === 'atp') {
      if (!playlist) {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a playlist name.`)
        return
      }
      if (!song) {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a spotify song link or name.`)
        return
      }
      if (playlist && song) {
        // if song is a spotify link, add it to the playlist
        if (song.includes('https://open.spotify.com/track/') && song.includes('?si')) {
          newLink = song.replace('https://open.spotify.com/track/', 'spotify:track:')
          // remove any query params from the link
          trackId = newLink.substring(0, newLink.indexOf('?'))

          // get only the track id from the link so we can get the track name
          const trackIdOnly = trackId.substring(trackId.lastIndexOf(':') + 1)
          // get the track name from the track id
          const track = await getTrack(trackIdOnly)

          addTracksToPlaylist(tags.username, playlist, trackId, track.name, track.artists[0].name)

          // if the song is a spotify link without query params
        } else if (song.includes('https://open.spotify.com/') && !song.includes('?si')) {
          newLink = song.replace('https://open.spotify.com/track/', 'spotify:track:')
          // get only the track id from the link
          const trackIdOnly = newLink.substring(newLink.lastIndexOf(':') + 1)
          // get the track name from the track id
          const track = await getTrack(trackIdOnly)
          addTracksToPlaylist(tags.username, playlist, newLink, track.name, track.artists[0].name)
          return
        }
        // if the song is not a spotify link, search for it on spotify
        else if (!song.includes('https://open.spotify.com/')) {
          const songResult = await searchSong(song)
          // extract the track id from the search result
          const trackId = songResult.substring(songResult.lastIndexOf(':') + 1)
          // get the track name from the track id
          const track = await getTrack(trackId)
          addTracksToPlaylist(tags.username, playlist, songResult, track.name, track.artists[0].name)
          return
        }
      } else {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a valid song.`)
      }
    }
  })
}

const removeSongFromPlaylistCommand = async () => {
  await refreshMiddleware()
  twitchClient.on('message', async (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    const playlist = message.slice(1).split(' ')[1]
    const song = message.slice(1).split(' ').slice(2).join(' ')
    if (command === 'removefromplaylist' || command === 'rfp') {
      if (!playlist) {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a playlist name.`)
        return
      }
      if (!song) {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a spotify song link or name.`)
        return
      }
      if (playlist && song) {
        // if song is a link to a song, tell user it must be a song name
        if (song.includes('https://open.spotify.com/track/')) {
          twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a song name.`)
          return
        } else {
          const songResult = await searchSong(song)
          // extract the track id from the search result
          const trackId = songResult.substring(songResult.lastIndexOf(':') + 1)
          // get the track information from the track id
          const track = await getTrack(trackId)
          // prompt user to confirm removal of song
          twitchClient.say(
            process.env.TWITCH_USERNAME,
            `Are you sure you want to remove ${track.name} by ${track.artists[0].name} from the ${playlist} playlist?`
          )
          // listen for user response
          twitchClient.on('message', async (channel, tags, message, self) => {
            if (self) return
            const command = message.slice(1).split(' ')[0].toLowerCase()
            if (command === 'yes') {
              removeTracksFromPlaylist(tags.username, playlist, track.name, track.artists[0].name, trackId)
            } else if (command === 'no') {
              twitchClient.say(process.env.TWITCH_USERNAME, `Song not removed.`)
            }
          })
        }
      } else {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a valid song.`)
      }
    }
  })
}

let isClearingPlaylist = false
let timeout
let playlistToClear

const clearPlaylistCommand = async () => {
  await refreshMiddleware()
  twitchClient.on('message', async (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    const playlist = message.slice(1).split(' ')[1]
    if (command === 'clearplaylist' || command === 'cp') {
      if (!playlist) {
        twitchClient.say(process.env.TWITCH_USERNAME, 'Please enter a playlist name.')
        return
      }
      playlistToClear = playlist
      if (playlist && !isClearingPlaylist) {
        // prompt user to confirm removal
        twitchClient.say(
          process.env.TWITCH_USERNAME,
          `Are you sure you want to clear the ${playlist} playlist? Respond with !yes or !no.`
        )
        isClearingPlaylist = true
        timeout = setTimeout(() => {
          twitchClient.say(
            process.env.TWITCH_USERNAME,
            `Playlist not cleared. Please respond with !yes or !no within 10 seconds to clear the playlist.`
          )
          isClearingPlaylist = false
        }, 10000)
      }
    } else if (isClearingPlaylist) {
      if (command === 'yes') {
        clearPlaylist(tags.username, playlistToClear)
        clearTimeout(timeout)
        isClearingPlaylist = false
      } else if (command === 'no') {
        twitchClient.say(process.env.TWITCH_USERNAME, 'Playlist not cleared.')
        clearTimeout(timeout)
        isClearingPlaylist = false
      }
    }
  })
}

let isDeletingPlaylist = false
let playlistToDelete

const deletePlaylistCommand = async () => {
  await refreshMiddleware()
  let timeout
  twitchClient.on('message', async (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'deleteplaylist' || command === 'dp') {
      const playlist = message.slice(1).split(' ')[1]
      if (!playlist) {
        twitchClient.say(process.env.TWITCH_USERNAME, `Please enter a playlist name.`)
        return
      }
      playlistToDelete = playlist
      // prompt user to confirm removal
      twitchClient.say(
        process.env.TWITCH_USERNAME,
        `Are you sure you want to delete the ${playlist} playlist? Respond with !yes or !no.`
      )
      isDeletingPlaylist = true
      // Set a timeout of 10 seconds
      timeout = setTimeout(() => {
        twitchClient.say(
          process.env.TWITCH_USERNAME,
          `Playlist not deleted. Please respond with !yes or !no within 10 seconds to delete the playlist.`
        )
        isDeletingPlaylist = false
      }, 10000)
    } else if (isDeletingPlaylist) {
      if (command === 'yes') {
        deletePlaylist(tags.username, playlistToDelete)
        isDeletingPlaylist = false
        // Clear the timeout when the user confirms
        clearTimeout(timeout)
      } else if (command === 'no') {
        twitchClient.say(process.env.TWITCH_USERNAME, `Playlist not deleted.`)
        isDeletingPlaylist = false
        // Clear the timeout when the user denies
        clearTimeout(timeout)
      }
    }
  })
}

const showPlaylistsCommand = async () => {
  await refreshMiddleware()
  twitchClient.on('message', async (channel, tags, message, self) => {
    if (self) return
    const command = message.slice(1).split(' ')[0].toLowerCase()
    if (command === 'showplaylists' || command === 'sp') {
      await showPlaylists(tags.username)
    }
  })
}

module.exports = {
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
  showPlaylistsCommand,
}
