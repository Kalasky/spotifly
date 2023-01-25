const express = require('express')
const router = express.Router()
const qs = require('qs')
const User = require('../models/User')
const utils = require('../utils/twitchUtils')

router.get('/twitch/login', async (req, res) => {
  const scope =
    'channel:manage:redemptions channel:read:redemptions channel:manage:vips chat:edit chat:read'

  res.redirect(
    307,
    'https://id.twitch.tv/oauth2/authorize?' +
      qs.stringify({
        response_type: 'code',
        client_id: process.env.TWITCH_CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      })
  )
})

let accessToken
let refreshToken

router.get('/twitch/callback', async (req, res) => {
  console.log('Twitch callback')
  // Get the authorization code from the query parameters
  const code = req.query.code
  const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: qs.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.TWITCH_REDIRECT_URI,
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
    }),
  })

  const tokenData = await tokenResponse.json()
  accessToken = tokenData.access_token
  refreshToken = tokenData.refresh_token

  const userResponse = await fetch('https://api.twitch.tv/helix/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Client-ID': process.env.TWITCH_CLIENT_ID,
    },
  })

  const userData = await userResponse.json()
  console.log(userData)
  const twitch_username = userData.data[0].login
  console.log(twitch_username)

  const user = await User.findOne({ twitchId: twitch_username })
  console.log(user)

  if (user) {
    utils.storeTwitchAccessToken(twitch_username, accessToken)
    utils.storeTwitchRefreshToken(twitch_username, refreshToken)
  } else {
    res.send('User not found. Please run the /setup discord command before logging in.')
  }
})

module.exports = router
