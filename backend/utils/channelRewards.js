const User = require('../models/User')
const twitchUtils = require('../utils/twitchUtils')
const { addToQueue, skipSong, changeVolume } = require('../utils/spotifyUtils')
const { sendMessage } = require('../utils/tmiUtils')

const incrementCost = async () => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
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
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=${process.env.TWITCH_REWARD_ID_SPOTIFY}&status=UNFULFILLED`,
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
    // grab the latest track link from the array of unfulfilled rewards
    const initialTrackLink = data.data[data.data.length - 1].user_input
    // remove the https://open.spotify.com/track/ from the link
    let newLink = initialTrackLink.replace('https://open.spotify.com/track/', 'spotify:track:')
    // remove the ?si=... from the link
    let trackId = newLink.substring(0, newLink.indexOf('?'))
    console.log(trackId)

    addToQueue(trackId)
    sendMessage(`@${data.data[data.data.length - 1].user_name} your song has been added to the queue!`)
  } catch (error) {
    console.log(error)
  }
}

const skipSpotifySong = async () => {
  skipSong()
}

const changeSpotifyVolume = async () => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })

  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=${process.env.TWITCH_REWARD_ID_VOLUME}&status=UNFULFILLED`,
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

    if (data.data.length > 0) {
      const volume = data.data[data.data.length - 1].user_input
      console.log(volume)
      changeVolume(volume)
      console.log('Volume changed and reward fulfilled.')
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
