const User = require('../models/User')

// this function will encode the data object into a query string for the fetch request
const encodeFormData = (data) => {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&')
}

const storeSpotifyAccessToken = async (userId, spotifyAccessToken) => {
  await User.findOneAndUpdate(userId, { spotifyAccessToken: spotifyAccessToken })
}

// this function will generate a new access token if the user's access token has expired
const generateAccessToken = async (userId, spotifyRefreshToken) => {
  console.log('generating new access token')
  const newToken = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
    },
    body: encodeFormData({
      grant_type: 'refresh_token',
      refresh_token: spotifyRefreshToken,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.access_token)
  await storeSpotifyAccessToken(userId, newToken)
  return newToken
}

const spotifyRefreshAccessTokenMiddleware = async (req, res, next) => {
  const user = await User.findOne({ spotifyId: process.env.SPOTIFY_USERNAME })

  try {
    // Try making a request to the Spotify API with the current access token
    const response = await fetch(`https://api.spotify.com/v1/me`, {
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
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
      const newToken = await generateAccessToken(user.spotifyId, user.spotifyRefreshToken)
      req.user = { ...user, spotifyAccessToken: newToken }
      next()
    }
  }
}

module.exports = spotifyRefreshAccessTokenMiddleware
