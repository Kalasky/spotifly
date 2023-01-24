const User = require('../models/User')

const storeTwitchAccessToken = async (userId, twitchAccessToken) => {
  await User.findOneAndUpdate(userId, { twitchAccessToken: twitchAccessToken })
}

const storeTwitchRefreshToken = async (userId, twitchRefreshToken) => {
  await User.findOneAndUpdate(userId, { twitchRefreshToken: twitchRefreshToken })
}

// verify the user's access token
const verifyAccessToken = async (userId, twitchAccessToken) => {
  const storedToken = await User.findOneAndUpdate(userId, twitchAccessToken)
  const isMatch = bcrypt.compare(twitchAccessToken, storedToken)
  return isMatch
}

// this function will generate a new access token if the user's access token has expired
const generateAccessToken = async (userId, twitchRefreshToken) => {
  const storedToken = await User.findOneAndUpdate(userId, twitchRefreshToken)

  const newToken = await fetch('https://accounts.twitch.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(process.env.TWITCH_CLIENT_ID + ':' + process.env.TWITCH_CLIENT_SECRET).toString('base64'),
    },
    body: encodeFormData({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.access_token)
  await storeAccessToken(userId, newToken)
  return newToken
}

// this function will refresh the user's access token if it has expired
const refreshAccessToken = async (userId, twitchRefreshToken) => {
  const newToken = generateAccessToken(userId, twitchRefreshToken)
  return newToken
}

// --------------------- FULFILL TWITCH REWARD FROM QUEUE ---------------------
const fulfillTwitchReward = async (twitch_username, accessToken, clientId, broadcaster_id, reward_id, id) => {
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
      response = await fulfillTwitchReward(twitch_username, newToken, clientId, broadcaster_id, reward_id, id)
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
const getUser = async (twitch_username, clientId, accessToken) => {
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
      data = await getUser(twitch_username, clientId, newToken)
      console.log('New token generated and getUser executed.')
    }
  } catch (error) {
    console.log(error)
  }
}

// --------------------- GET CHANNEL REWARD ---------------------
const getReward = async (twitch_username, broadcaster_id, clientId, accessToken, reward_id) => {
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}&reward_id=${reward_id}`,
      {
        method: 'GET',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await res.json()
    console.log(data)

    if (res.status === 401) {
      const newToken = await refreshAccessToken(twitch_username, refreshToken)
      data = await getReward(twitch_username, broadcaster_id, newToken, clientId, reward_id)
      console.log('New token generated and getReward executed.')
    }
  } catch (error) {
    console.log(error)
  }
}

// --------------------- CREATE CHANNEL REWARD ---------------------\
const createQueueReward = async (
  twitch_username,
  broadcaster_id,
  clientId,
  accessToken,
  title,
  prompt,
  cost,
  background_color,
  is_user_input_required,
  is_global_cooldown_enabled,
  global_cooldown_seconds
) => {
  try {
    const res = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${accessToken}`,
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
      const newToken = await refreshAccessToken(twitch_username, refreshToken)
      data = await createQueueReward(
        twitch_username,
        broadcaster_id,
        newToken,
        clientId,
        title,
        prompt,
        cost,
        background_color,
        is_user_input_required,
        is_global_cooldown_enabled,
        global_cooldown_seconds
      )
      console.log('New token generated and createQueueReward executed.')
    }
  } catch (error) {
    console.error(error)
  }
}

module.exports = {
  storeTwitchAccessToken,
  storeTwitchRefreshToken,
  verifyAccessToken,
  generateAccessToken,
  refreshAccessToken,
  fulfillTwitchReward,
  getUser,
  getReward,
  createQueueReward,
}
