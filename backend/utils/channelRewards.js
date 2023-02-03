const User = require('../models/User')
const twitchUtils = require('../utils/twitchUtils')
const { addToQueue, skipSong, changeVolume } = require('../utils/spotifyUtils')
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
      hasMore = data.pagination.cursor !== null
      after = data.pagination.cursor
    }
    // check if latestReward is not empty
    if (latestReward) {
      // remove the https://open.spotify.com/track/ from the link
      let newLink = latestReward.replace('https://open.spotify.com/track/', 'spotify:track:')
      // remove the ?si=... from the link
      let trackId = newLink.substring(0, newLink.indexOf('?'))

      // if https://open.spotify.com/artist/ is in the trackId, then it's an artist link, send error
      if (trackId.includes('https://open.spotify.com/artist/')) {
        twitchClient.say(process.env.TWITCH_USERNAME, "You can't add an artist link to the queue!")
        return
      }

      addToQueue(trackId)
      twitchClient.say(process.env.TWITCH_USERNAME, 'Added to queue!')
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
