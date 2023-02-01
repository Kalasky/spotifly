const User = require('../models/User')

// fulfill twitch channel reward from the redemption queue
const fulfillTwitchReward = async (clientId, broadcaster_id, reward_id, id) => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${broadcaster_id}&reward_id=${reward_id}&id=${id}`,
      {
        method: 'PATCH',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${user.twitchAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FULFILLED',
        }),
      }
    )
    return res
  } catch (error) {
    console.log(error)
  }
}

// get specified twitch user
const getUser = async (twitch_username, clientId) => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
  try {
    const res = await fetch(`https://api.twitch.tv/helix/users?login=${twitch_username}`, {
      method: 'GET',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${user.twitchAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    console.log(data)
  } catch (error) {
    console.log(error)
  }
}

// get specific channel reward information
const getSpecificReward = async (twitch_username, broadcaster_id, clientId, reward_id) => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}&reward_id=${reward_id}`,
      {
        method: 'GET',
        headers: {
          'Client-ID': clientId,
          Authorization: `Bearer ${user.twitchAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await res.json()
    console.log(data)
  } catch (error) {
    console.log(error)
  }
}

// get all channel rewards for a specific broadcaster
const getAllRewards = async (broadcaster_id, clientId) => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })

  try {
    const res = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${broadcaster_id}`, {
      method: 'GET',
      headers: {
        'Client-ID': clientId,
        Authorization: `Bearer ${user.twitchAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    console.log(data)
  } catch (error) {
    console.log(error)
  }
}

// create a new channel reward
const createReward = async (
  title,
  prompt,
  cost,
  background_color,
  is_user_input_required,
  is_global_cooldown_enabled,
  global_cooldown_seconds
) => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
  const twitchAccessToken = user.twitchAccessToken
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}`,
      {
        method: 'POST',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
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
      }
    )
    const data = await res.json()
    console.log(data)
  } catch (error) {
    console.error(error)
  }
}

// create a webhook eventsub subscription for a specific channel reward
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

// delete a webhook eventsub subscription for a specific channel reward
const deleteEventSub = async (clientId, app_access_token, subscription_id) => {
  const res = await fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscription_id}`, {
    method: 'DELETE',
    headers: {
      'Client-ID': clientId,
      Authorization: `Bearer ${app_access_token}`,
      'Content-Type': 'application/json',
    },
  })
  return res
}

// delete all webhook eventsub subscriptions
// this function must be executed after every stream
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

// list all webhook eventsub subscriptions
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
  fulfillTwitchReward,
  getUser,
  getSpecificReward,
  getAllRewards,
  createReward,
  createEventSub,
  eventSubList,
  deleteEventSub,
  dumpEventSubs,
}
