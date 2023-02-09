const User = require('../models/User')
const twitchUtils = require('../utils/twitchUtils')
const { addToQueue, skipSong, changeVolume, searchSong } = require('../utils/spotifyUtils')
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
    let data = []
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
      data = await res.json()
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
      // remove the ?si=... from the link
      let trackId = newLink.substring(0, newLink.indexOf('?'))

      // check if the link is not a track link
      if (!trackId.includes('spotify:track:')) {
        const searchResult = await searchSong(latestReward)
        trackId = searchResult
        addToQueue(trackId, latestUsername)
        return
      }

      // if link doesnt have a ? in it, it means it doesnt have any query params
      if (!newLink.includes('?')) {
        trackId = newLink
      }

      // get only the track id from the link
      const trackIdOnly = trackId.substring(trackId.lastIndexOf(':') + 1)

      // check length of song and return if it is longer than 10 minutes
      const getTrackLength = await fetch(`https://api.spotify.com/v1/tracks/${trackIdOnly}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user.spotifyAccessToken}`,
        },
      })
      
      const trackLength = await getTrackLength.json()
      console.log('user.songDurationLimit', user.songDurationLimit)
      if (trackLength.duration_ms > user.songDurationLimit) {
        twitchClient.say(
          process.env.TWITCH_USERNAME,
          `Sorry, that song is too long. The max duration is ${(user.songDurationLimit / 60000).toFixed(1)} minutes.`
        )
        return
      }
      addToQueue(trackId, latestUsername)
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

module.exports = {
  incrementCost,
  addToSpotifyQueue,
  skipSpotifySong,
  changeSpotifyVolume,
}
