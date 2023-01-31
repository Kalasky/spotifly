const express = require('express')
const router = express.Router()
const qs = require('qs')
const User = require('../models/User')
const bcrypt = require('bcrypt')
const utils = require('../utils/spotifyUtils')

// this route will accept get requests at /api/login and redirect to the spotify login page
router.get('/spotify/login', async (req, res) => {
  const scope = `user-modify-playback-state
      user-read-playback-state 
      user-read-playback-position
      user-follow-read
      user-read-currently-playing
      user-read-recently-played
      user-read-private
      user-library-modify
      user-library-read
      user-top-read
      user-follow-modify
      playlist-read-private
      playlist-modify-public`
  // redirect to spotify login page with the client id, redirect uri, and scope as query parameters
  res.redirect(
    307,
    'https://accounts.spotify.com/authorize?' +
      qs.stringify({
        response_type: 'code',
        client_id: process.env.SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
      })
  )
})

let accessToken
let refreshToken

router.get('/spotify/callback', async (req, res) => {
  const code = req.query.code
  const body = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  }

  await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: utils.encodeFormData(body), // encode the data object into a query string
  })
    .then((response) => response.json())
    .then(async (data) => {
      // extract access token and refresh token from response
      accessToken = data.access_token
      refreshToken = data.refresh_token

      console.log('access token: ', accessToken + '\n' + 'refresh token: ', refreshToken)

      // make fetch request to get user info
      const res = await fetch('https://api.spotify.com/v1/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data)
          // extract user info from response
          const spotifyId = data.id
          const spotifyFollowers = data.followers.total

          // find user in the database by their spotify id
          const user = User.findOne({ spotifyId: spotifyId })

          // if user is in the database and update their spotify id and followers
          if (user !== null) {
            utils.storeSpotifyAccessToken(spotifyId, accessToken)
            utils.storeSpotifyRefreshToken(spotifyId, refreshToken)

            User.findOneAndUpdate({ spotifyId: spotifyId }).then((user) => {
              if (user === null) {
                res.send('User not found! Please run the /setup discord command.')
                return
              }

              if (data.product === 'premium') {
                user.isPremium = true
              }
              user.spotifyId = spotifyId
              user.spotifyFollowers = spotifyFollowers
              user.authorized = true
              user.save()
            })
          } else {
            res.send('User not found. Please run the /setup discord command before logging in.')
          }
        })
    })
})

module.exports = router
