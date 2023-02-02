const { sendMessage } = require('./tmiUtils')
const User = require('../models/User')

// --------------------- PLAYBACK FUNCTIONS ---------------------

// this function will pause the user's currently playing song
const pauseSong = async () => {
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    return res
  } catch (error) {
    console.log(error)
  }
}

// this function will resume the user's currently playing song
const resumeSong = async () => {
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    return res
  } catch (error) {
    console.log(error)
  }
}

// this function will skip the user's currently playing song
const skipSong = async () => {
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    return res
  } catch (error) {
    console.log(error)
  }
}

// this function will add a song to the user's queue
const addToQueue = async (uri) => {
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    let res = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log('addToQueue repsonse status:', res.status)
    return res
  } catch (error) {
    console.log(error)
    if (error.message === 'Error adding track to queue.' && error.status !== 401) {
      sendMessage(
        'Invalid Spotify song link. Please try again. (Example: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=32cfb1adf4b942d9)'
      )
    }
  }
}

const changeVolume = async (volume) => {
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    return res
  } catch (error) {
    console.log(error)
  }
}

const currentSong = async () => {
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    sendMessage(`Now playing: ${data.item.name} by: ${data.item.artists[0].name} Link: ${data.item.external_urls.spotify}`)
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  pauseSong,
  resumeSong,
  addToQueue,
  skipSong,
  changeVolume,
  currentSong
}
