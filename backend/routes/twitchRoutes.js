const express = require('express')
const router = express.Router()
const qs = require('qs')

router.get('/twitch/login', async (req, res) => {
  const scope = 'channel:manage:redemptions'

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

router.get('/twitch/callback', async (req, res) => {
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

  // Send the access token back to the client
  res.send(tokenData)
})

module.exports = router
