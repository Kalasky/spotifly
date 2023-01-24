const bcrypt = require('bcrypt')
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

const storeSpotifyRefreshToken = async (userId, spotifyRefreshToken) => {
  await User.findOneAndUpdate(userId, { spotifyRefreshToken: spotifyRefreshToken })
}

// verify the user's access token
const verifyAccessToken = async (userId, spotifyAccessToken) => {
  const storedToken = await User.findOneAndUpdate(userId, spotifyAccessToken)
  const isMatch = bcrypt.compare(spotifyAccessToken, storedToken)
  return isMatch
}

// this function will generate a new access token if the user's access token has expired
const generateAccessToken = async (userId, spotifyRefreshToken) => {
  const storedToken = await User.findOneAndUpdate(userId, spotifyRefreshToken)

  const newToken = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
    },
    body: encodeFormData({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.access_token)
  await storeSpotifyAccessToken(userId, newToken)
  return newToken
}

// this function will refresh the user's access token if it has expired
const refreshAccessToken = async (userId, spotifyRefreshToken) => {
  const newToken = generateAccessToken(userId, spotifyRefreshToken)
  return newToken
}

// --------------------- PLAYBACK FUNCTIONS ---------------------

// this function will pause the user's currently playing song
const pauseSong = async (userId, accessToken, refreshToken) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.statusText === 'Unauthorized') {
      const newToken = await refreshAccessToken(userId, refreshToken)
      await pauseSong(userId, newToken)
      console.log('New token generated and song paused.')
    }

    return response
  } catch (error) {
    console.log(error)
  }
}

// this function will resume the user's currently playing song
const resumeSong = async (userId, accessToken) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.statusText === 'Unauthorized') {
      const newToken = await refreshAccessToken(userId, refreshToken)
      await resumeSong(userId, newToken)
      console.log('New token generated and song resumed.')
    }
    return response
  } catch (error) {
    console.log(error)
  }
}

// this function will add a song to the user's queue
const addToQueue = async (userId, accessToken, refreshToken, uri) => {
  try {
    let response = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (response.status === 401) {
      const newToken = await refreshAccessToken(userId, refreshToken)
      response = await addToQueue(userId, newToken, uri)
      console.log('New token generated and added to queue.')
    }
    if (response.ok) {
      console.log('Track added to queue!')
    } else {
      const json = await response.json()
      console.log(json)
      throw new Error('Error adding track to queue.')
    }
  } catch (error) {
    console.log(error)
    throw error
  }
}

module.exports = {
  storeSpotifyAccessToken,
  storeSpotifyRefreshToken,
  verifyAccessToken,
  generateAccessToken,
  refreshAccessToken,
  pauseSong,
  resumeSong,
  encodeFormData,
  addToQueue,
}