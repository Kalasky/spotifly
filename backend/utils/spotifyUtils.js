const User = require('../models/User')
const { twitchHandler } = require('../middleware/twitchRefreshHandler')
const { spotifyHandler } = require('../middleware/spotifyRefreshHandler')
const { setupTwitchClient } = require('./tmiSetup')
const twitchClient = setupTwitchClient()

const refreshMiddleware = async () => {
  await twitchHandler()
  await spotifyHandler()
}

// --------------------- PLAYBACK FUNCTIONS ---------------------

const searchSong = async (query) => {
  await refreshMiddleware()
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()

    // if no song is found, return an error message
    if (!data.tracks.items[0]) {
      twitchClient.say(process.env.TWITCH_USERNAME, 'No song found from Spotify. Please try again.')
      return
    }

    const trackId = data.tracks.items[0].uri
    return trackId
  } catch (error) {
    console.log(error)
  }
}

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
    const data = await res.json()
    console.log(data)
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
    const data = await res.json()
    console.log(data)
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
    const data = await res.json()
    console.log(data)
    return res
  } catch (error) {
    console.log(error)
  }
}

// this function will add a song to the user's queue
const addToQueue = async (uri, username) => {
  console.log('uri:', uri, 'username:', username)
  const user = await User.findOne({ spotifyUsername: process.env.SPOTIFY_USERNAME })
  try {
    let res = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    console.log('addToQueue response status:', res.status)

    if (res.status === 204) {
      twitchClient.say(process.env.TWITCH_USERNAME, `@${username}'s song has been added to the queue!`)
    } else {
      try {
        const data = await res.json()
        console.log(data)
      } catch (error) {
        console.error(`An error occurred while parsing the JSON data: ${error}`)
      }
    }
    return res
  } catch (error) {
    console.log(error)
    if (error.status === 404) {
      twitchClient.say(
        process.env.TWITCH_USERNAME,
        'No active device found. The streamer must be playing music to add a song to the queue.'
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
    const data = await res.json()
    console.log(data)
    return res
  } catch (error) {
    console.log(error)
  }
}

const currentSong = async () => {
  await refreshMiddleware()
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
    console.log(data)
    twitchClient.say(
      process.env.TWITCH_USERNAME,
      `Now playing: ${data.item.name} by: ${data.item.artists[0].name} Link: ${data.item.external_urls.spotify}`
    )
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
  currentSong,
  searchSong,
}
