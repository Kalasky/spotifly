const bcrypt = require('bcrypt')
const User = require('../models/User')
const { addToQueue } = require('./spotifyUtils')
const { sendMessage } = require('./tmiUtils')

// this function will encode the data object into a query string for the fetch request
const encodeFormData = (data) => {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
}

const storeTwitchAccessToken = async (userId, twitchAccessToken) => {
  await User.findOneAndUpdate(userId, { twitchAccessToken: twitchAccessToken })
}

const storeTwitchRefreshToken = async (userId, twitchRefreshToken) => {
  await User.findOneAndUpdate(userId, { twitchRefreshToken: twitchRefreshToken })
}

// this function will generate a new access token if the user's access token has expired
const generateAccessToken = async (userId, twitchRefreshToken) => {
  const newToken = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeFormData({
      grant_type: 'refresh_token',
      refresh_token: twitchRefreshToken,
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.access_token)
  await storeTwitchAccessToken(userId, newToken)
  return newToken
}

// this function will refresh the user's access token if it has expired
const refreshAccessToken = async (userId, twitchRefreshToken) => {
  const newToken = generateAccessToken(userId, twitchRefreshToken)
  return newToken
}

// --------------------- FULFILL TWITCH REWARD FROM QUEUE ---------------------
const fulfillTwitchReward = async (twitch_username, accessToken, refreshToken, clientId, broadcaster_id, reward_id, id) => {
  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${broadcaster_id}&reward_id=${reward_id}&id=${id}`,
      {
        method: 'PATCH',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FULFILLED',
        }),
      }
    )

    if (response.status === 401) {
      const newToken = await refreshAccessToken(twitch_username, refreshToken)
      await fulfillTwitchReward(twitch_username, newToken, refreshToken, clientId, broadcaster_id, reward_id, id)
      console.log('New token generated and added to queue.')
    }

    if (response.ok) {
      console.log('Reward fulfilled!')
    } else {
      const json = await response.json()
      console.log(json)
      throw new Error('Error fulfilling reward.')
    }
  } catch (error) {
    console.log(error)
  }
}

// --------------------- GET TWITCH USER ---------------------
const getUser = async (twitch_username, clientId, accessToken, refreshToken) => {
  try {
    const res = await fetch(`https://api.twitch.tv/helix/users?login=${twitch_username}`, {
      method: 'GET',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    console.log(data)

    if (res.status === 401) {
      const newToken = await refreshAccessToken(twitch_username, refreshToken)
      await getUser(twitch_username, clientId, newToken, refreshToken)
      console.log('New token generated and getUser executed.')
    }
  } catch (error) {
    console.log(error)
  }
}

// --------------------- GET CHANNEL REWARD ---------------------
const getSpecificReward = async (twitch_username, broadcaster_id, clientId, reward_id) => {
  const user = await User.findOne({ twitchId: twitch_username })
  const twitchAccessToken = user.twitchAccessToken
  const twitchRefreshToken = user.twitchRefreshToken
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}&reward_id=${reward_id}`,
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
    console.log(data)

    if (res.status === 401) {
      const newToken = await refreshAccessToken(twitch_username, twitchRefreshToken)
      await getReward(twitch_username, broadcaster_id, clientId, reward_id)
      console.log('New token generated and getReward executed.')
    }
  } catch (error) {
    console.log(error)
  }
}

const getAllRewards = async (twitch_username, broadcaster_id, clientId) => {
  const user = await User.findOne({ twitchId: twitch_username })
  const twitchAccessToken = user.twitchAccessToken
  const twitchRefreshToken = user.twitchRefreshToken

  try {
    const res = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}`, {
      method: 'GET',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${twitchAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    console.log(data)

    if (res.status === 401) {
      const newToken = await refreshAccessToken(twitch_username, twitchRefreshToken)
      await getAllRewards(twitch_username, broadcaster_id, clientId)
      console.log('New token generated and getAllRewards executed.')
    }
  } catch (error) {
    console.log(error)
  }
}

// --------------------- CREATE CHANNEL REWARD ---------------------\
const createReward = async (
  twitch_username,
  broadcaster_id,
  clientId,
  title,
  prompt,
  cost,
  background_color,
  is_user_input_required,
  is_global_cooldown_enabled,
  global_cooldown_seconds
) => {
  const user = await User.findOne({ twitchId: twitch_username })
  const twitchAccessToken = user.twitchAccessToken
  const twitchRefreshToken = user.twitchRefreshToken
  try {
    const res = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${twitchAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        prompt: prompt,
        cost: cost,
        is_enabled: true,
        background_color: background_color,
        is_user_input_required: is_user_input_required,
        is_global_cooldown_enabled: is_global_cooldown_enabled,
        global_cooldown_seconds: global_cooldown_seconds,
      }),
    })
    const data = await res.json()
    console.log(data)
    if (res.status === 401) {
      console.log('Access token expired. Generating new token (createReward)...')
      const newToken = await refreshAccessToken(twitch_username, twitchRefreshToken)
      await createReward(
        twitch_username,
        broadcaster_id,
        clientId,
        title,
        prompt,
        cost,
        background_color,
        is_user_input_required,
        is_global_cooldown_enabled,
        global_cooldown_seconds
      )
      console.log('New token generated and createReward executed.')
    }
  } catch (error) {
    console.error(error)
  }
}

const getNewRedemptionEvents = async (twitch_username, clientId, broadcaster_id, reward_id) => {
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
      console.log('Token expired. Generating new token (getNewRedemptionEvents)...')
      const newToken = await refreshAccessToken(twitch_username, twitchRefreshToken)
      await getNewRedemptionEvents(twitch_username, clientId, broadcaster_id, reward_id)
      console.log('New token generated and getNewRedemptionEvents executed.')
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
      fulfillTwitchReward(
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

const createEventSub = async (clientId, app_access_token, broadcaster_id, reward_id, ngrok_tunnel_url, webook_secret) => {
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${app_access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'channel.channel_points_custom_reward_redemption.add',
      version: '1',
      condition: {
        broadcaster_user_id: broadcaster_id,
        reward_id: reward_id,
      },
      transport: {
        method: 'webhook',
        callback: ngrok_tunnel_url + '/api/twitch/eventsub',
        secret: webook_secret,
      },
    }),
  })
  const data = await res.json()
  console.log(data.data)
}

const deleteEventSub = async (clientId, app_access_token, subscription_id) => {
  const res = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscription_id}`, {
    method: 'DELETE',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${app_access_token}`,
      'Content-Type': 'application/json',
    },
  })
}

// do this after EVERY stream
const dumpEventSubs = async (clientId, app_access_token) => {
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions?status=enabled', {
    method: 'GET',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${app_access_token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()

  for (let i = 0; i < data.data.length; i++) {
    console.log(data.data[i].id)
    deleteEventSub(clientId, app_access_token, data.data[i].id)
  }
}


const eventSubList = async (clientId, app_access_token) => {
  const res = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions?status=enabled', {
    method: 'GET',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${app_access_token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  console.log(data)
}

module.exports = {
  storeTwitchAccessToken,
  storeTwitchRefreshToken,
  generateAccessToken,
  refreshAccessToken,
  fulfillTwitchReward,
  getUser,
  getSpecificReward,
  getAllRewards,
  createReward,
  getNewRedemptionEvents,
  createEventSub,
  eventSubList,
  deleteEventSub,
  dumpEventSubs,
}
