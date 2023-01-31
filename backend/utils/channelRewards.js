const User = require('../models/User')
const twitchUtils = require('../utils/twitchUtils')
const spotifyUtils = require('../utils/spotifyUtils')
const { addToQueue } = require('../utils/spotifyUtils')

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
      })
  } catch (e) {
    console.log(e)
  }
}

const addToSpotifyQueue = async (twitch_username, clientId, broadcaster_id, reward_id) => {
  const user = await User.findOne({ twitchId: twitch_username })
  const twitchAccessToken = user.twitchAccessToken
  const twitchRefreshToken = user.twitchRefreshToken
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${broadcaster_id}&reward_id=${reward_id}&status=UNFULFILLED`,
      {
        method: 'GET',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${twitchAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await res.json()

    if (res.status === 401) {
      console.log('Token expired. Generating new token (addToSpotifyQueue)...')
      await twitchUtils.refreshAccessToken(twitch_username, twitchRefreshToken)
      await addToSpotifyQueue(twitch_username, clientId, broadcaster_id, reward_id)
      console.log('New token generated and addToSpotifyQueue executed.')
    }

    if (data.data.length > 0) {
      const initialTrackLink = data.data[0].user_input
      var newLink = initialTrackLink.replace('https://open.spotify.com/track/', 'spotify:track:')
      var trackId = newLink.substring(0, newLink.indexOf('?'))
      console.log(trackId)

      const spotify_username = user.spotifyId
      const spotifyAccessToken = user.spotifyAccessToken
      const spotifyRefreshToken = user.spotifyRefreshToken

      addToQueue(spotify_username, spotifyAccessToken, spotifyRefreshToken, trackId)
      twitchUtils.fulfillTwitchReward(
        twitch_username,
        twitchAccessToken,
        twitchRefreshToken,
        clientId,
        broadcaster_id,
        reward_id,
        data.data[0].id
      )
      console.log('Track added to queue and reward fulfilled.')
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  incrementCost,
  addToSpotifyQueue,
}
