const User = require('../models/User')

// this function will encode the data object into a query string for the fetch request
const encodeFormData = (data) => {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
}

const storeTwitchAccessToken = async (userId, twitchAccessToken) => {
  await User.findOneAndUpdate(userId, { twitchAccessToken: twitchAccessToken })
}

// this function will generate a new access token if the user's access token has expired
const generateAccessToken = async (userId, twitchRefreshToken) => {
  console.log('generating new access token')
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

const twitchRefreshAccessTokenMiddleware = async (req, res, next) => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })

  try {
    // Try making a request to the Twitch API with the current access token
    const response = await fetch(`https://api.twitch.tv/helix/users`, {
      headers: {
        Authorization: `Bearer ${user.twitchAccessToken}`,
        'Client-ID': process.env.TWITCH_CLIENT_ID,
      },
    })

    // If the request is successful, continue with the current access token
    if (response.ok) {
      req.user = user
      next()
    }
  } catch (error) {
    // If the request fails with a "401 Unauthorized" error, generate a new access token
    if (error.status === 401) {
      const newToken = await generateAccessToken(user.twitchId, user.twitchRefreshToken)
      req.user = { ...user, twitchAccessToken: newToken }
      next()
    }
  }
}

module.exports = twitchRefreshAccessTokenMiddleware
