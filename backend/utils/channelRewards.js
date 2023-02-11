const User = require('../models/User')
const twitchUtils = require('../utils/twitchUtils')
const {
  addToQueue,
  skipSong,
  changeVolume,
  searchSong,
  getTrackLength,
  playPlaylist,
  queueStatus,
} = require('../utils/spotifyUtils')
const { getTrack } = require('../utils/tmiUtils')
const { setupTwitchClient } = require('./tmiSetup')
const twitchClient = setupTwitchClient()

const incrementCost = async () => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  try {
    const getReward = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&id=${process.env.TWITCH_REWARD_ID_PENNY}`,
      {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${user.twitchAccessToken}`,
        },
      }
    )
      .then((res) => res.json())
      .then(async (data) => {
        let cost = data.data[0].cost

        const res = await fetch(
          `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&id=${process.env.TWITCH_REWARD_ID_PENNY}`,
          {
            method: 'PATCH',
            headers: {
              'Client-ID': process.env.TWITCH_CLIENT_ID,
              Authorization: `Bearer ${user.twitchAccessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cost: cost + 1,
            }),
          }
        )
        return res
      })
  } catch (e) {
    console.log(e)
  }
}

const addToSpotifyQueue = async () => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  try {
    // hasMore is used to check if there are more redemptions in the queue
    let hasMore = true
    let after = ''
    let latestReward = ''
    let latestUsername = ''
    while (hasMore) {
      const res = await fetch(
        `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=${process.env.TWITCH_REWARD_ID_SPOTIFY}&status=UNFULFILLED&first=50&after=${after}`,
        {
          method: 'GET',
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${user.twitchAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data = await res.json()
      // if there are no more redemptions, break out of the loop
      if (data.data.length === 0) {
        hasMore = false
        console.log('No more redemptions.')
        break
      }
      // grab the latest track link from the array of unfulfilled rewards
      latestReward = data.data[data.data.length - 1].user_input
      // grab the latest username from the array of unfulfilled rewards
      latestUsername = data.data[data.data.length - 1].user_name
      // check if the requester is blacklisted
      if (user.blacklist.includes(data.data[data.data.length - 1].user_name)) {
        twitchClient.say(process.env.TWITCH_USERNAME, `Sorry, ${latestUsername} is blacklisted.`)
        return
      }

      hasMore = data.pagination.cursor !== null
      after = data.pagination.cursor
    }
    // check if latestReward is not empty
    if (latestReward) {
      // remove the https://open.spotify.com/track/ from the link
      let newLink = latestReward.replace('https://open.spotify.com/track/', 'spotify:track:')
      console.log('new link: ', newLink)
      // remove the ?si=... from the link
      if (newLink.includes('?si=')) {
        newLink = newLink.substring(0, newLink.indexOf('?si='))
      }

      // check if the link is not a track link
      if (!newLink.includes('spotify:track:')) {
        const songResult = await searchSong(latestReward)
        if (!songResult) {
          return
        } else {
          const trackId = songResult.substring(songResult.lastIndexOf(':') + 1)
          const track = await getTrack(trackId)

          // get only the track id from the link
          const trackLength = await getTrackLength(track.uri)
          console.log('track length: ', trackLength)

          // check if the song is too long to be added to the queue
          if (trackLength > user.songDurationLimit) {
            twitchClient.say(
              process.env.TWITCH_USERNAME,
              `Sorry, that song is too long. The max duration is ${(user.songDurationLimit / 60000).toFixed(1)} minutes.`
            )
            return
          }

          const res = await addToQueue(track.uri, latestUsername)
          // if no active device is found, do not send the message
          if (res.status !== 404) {
            twitchClient.say(process.env.TWITCH_USERNAME, `Added ${latestUsername}'s song to the queue.`)
          }
          return
        }
      }

      // if link doesnt have a ? in it, it means it doesnt have any query params
      if (!newLink.includes('?')) {
        trackId = newLink
      }

      // get the track length
      const trackLength = await getTrackLength(trackId)
      console.log('track length: ', trackLength)

      // check if the song is too long to be added to the queue
      if (trackLength > user.songDurationLimit) {
        twitchClient.say(
          process.env.TWITCH_USERNAME,
          `Sorry, that song is too long. The max duration is ${(user.songDurationLimit / 60000).toFixed(1)} minutes.`
        )
        return
      }

      const res = await addToQueue(trackId, latestUsername)
      console.log('res: ', res.status)
      // if no active device is found, do not send the message
      if (res.status !== 404) {
        twitchClient.say(process.env.TWITCH_USERNAME, `Added ${latestUsername}'s song to the queue.`)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const skipSpotifySong = async () => {
  skipSong()
}

const changeSpotifyVolume = async () => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  try {
    let hasMore = true
    let after = ''
    let latestReward = ''
    while (hasMore) {
      const res = await fetch(
        `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=${process.env.TWITCH_REWARD_ID_VOLUME}&status=UNFULFILLED&first=50&after=${after}`,
        {
          method: 'GET',
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${user.twitchAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data = await res.json()

      // if there are no more redemptions, break out of the loop
      if (data.data.length === 0) {
        hasMore = false
        console.log('No more redemptions.')
        break
      }

      // grab the latest track link from the array of unfulfilled rewards
      latestReward = data.data[data.data.length - 1].user_input
      hasMore = data.pagination.cursor !== null
      after = data.pagination.cursor

      if (latestReward) {
        const volume = data.data[data.data.length - 1].user_input
        console.log(volume)
        changeVolume(volume)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const playUserPlaylist = async () => {
  console.log('play user playlist')
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  try {
    let hasMore = true
    let after = ''
    let latestReward = ''
    while (hasMore) {
      const res = await fetch(
        `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=${process.env.TWITCH_REWARD_ID_PLAY_PLAYLIST}&status=UNFULFILLED&first=50&after=${after}`,
        {
          method: 'GET',
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID,
            Authorization: `Bearer ${user.twitchAccessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )
      const data = await res.json()

      // if there are no more redemptions, break out of the loop
      if (data.data.length === 0) {
        hasMore = false
        console.log('No more redemptions.')
        break
      }

      // grab the latest track link from the array of unfulfilled rewards
      latestReward = data.data[data.data.length - 1].user_input
      latestUsername = data.data[data.data.length - 1].user_name
      hasMore = data.pagination.cursor !== null
      after = data.pagination.cursor

      if (latestReward) {
        const playlist = data.data[data.data.length - 1].user_input
        console.log(playlist)
        playPlaylist(latestUsername, playlist)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  incrementCost,
  addToSpotifyQueue,
  skipSpotifySong,
  changeSpotifyVolume,
  playUserPlaylist,
}
