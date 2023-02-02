const express = require('express')
const router = express.Router()
const User = require('../models/User')
const qs = require('qs')

router.get('/twitch/login', async (req, res) => {
  const scope = 'channel:manage:redemptions channel:read:redemptions channel:manage:vips chat:edit chat:read'

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

  // find user by their twitch username or spotify username
  const user = await User.findOne({
    $or: [{ twitchUsername: process.env.TWITCH_USERNAME }, { spotifyUsername: process.env.SPOTIFY_USERNAME }],
  })

  if (user) {
    User.findOneAndUpdate(
      { twitchUsername: process.env.TWITCH_USERNAME },
      { twitchAccessToken: accessToken, twitchRefreshToken: refreshToken },
      { new: true }, // return updated doc
      (err, doc) => {
        if (err) {
          console.log('Something wrong when updating data!', err)
        }
        console.log('User successfully updated', doc)
      }
    )
  } else {
    // if user is not in the database, create a new user
    const newUser = new User({
      spotifyUsername: process.env.SPOTIFY_USERNAME,
      spotifyAccessToken: '', // will be updated later by the spotify login
      spotifyRefreshToken: '', // will be updated later by the spotify login
      twitchUsername: process.env.TWITCH_USERNAME,
      twitchAccessToken: accessToken,
      twitchRefreshToken: refreshToken,
    })
    await newUser.save()
  }
})

module.exports = router
