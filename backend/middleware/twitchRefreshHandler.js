const User = require('../models/User')
const { setupTwitchClient } = require('../utils/tmiSetup')
const twitchClient = setupTwitchClient()

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
  await User.findByIdAndUpdate(userId, { twitchRefreshToken: twitchRefreshToken })
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

const twitchRefreshAccessTokenMiddleware = async (req, res, next) => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })

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
      console.log('Twitch access token is valid.')
      req.user = user
      next()
    }

    // If the request fails with a "401 Unauthorized" error, generate a new access token
    if (response.status === 401) {
      console.log('Twitch access token has expired, generating new access token...')
      const newToken = await generateAccessToken(user.twitchUsername, user.twitchRefreshToken)
      if (newToken) {
        req.user = { ...user, twitchAccessToken: newToken }
        next()
      } else {
        console.error('Twitch Refresh token FAILED. Visit http://localhost:8888/api/twitch/login to renew your tokens.')
        twitchClient.say(process.env.TWITCH_USERNAME, 'Twitch Refresh token FAILED. Check the console for more info.')
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const twitchHandler = async () => {
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })

  try {
    // Try making a request to the Twitch API with the current access token
    const response = await fetch(`https://api.twitch.tv/helix/users`, {
      headers: {
        Authorization: `Bearer ${user.twitchAccessToken}`,
        'Client-ID': process.env.TWITCH_CLIENT_ID,
      },
    })

    if (response.ok) {
      console.log('Twitch access token is valid.')
    }

    // If the request fails with a "401 Unauthorized" error, generate a new access token
    if (response.status === 401) {
      console.log('Twitch access token has expired, generating new access token...')
      const newToken = await generateAccessToken(user.twitchUsername, user.twitchRefreshToken)
      if (newToken) {
        console.log('New access token generated successfully!')
      } else {
        console.error('Twitch Refresh token FAILED. Visit http://localhost:8888/api/twitch/login to renew your tokens.')
        twitchClient.say(process.env.TWITCH_USERNAME, 'Twitch Refresh token FAILED. Check the console for more info.')
      }
    }
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  twitchRefreshAccessTokenMiddleware,
  twitchHandler,
  storeTwitchAccessToken,
  storeTwitchRefreshToken,
}
