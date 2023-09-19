const User = require('../models/User')
const Viewer = require('../models/Viewer')
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

// this function will pause the streamer's currently playing song
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

// this function will resume the streamer's currently playing song
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

// this function will skip the streamer's currently playing song
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

// this function will add a song to the streamer's queue
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
      return res
    } else {
      try {
        const data = await res.json()
        console.log(data)
      } catch (error) {
        console.error(`An error occurred while parsing the JSON data: ${error}`)
      }
    }
    if (res.status === 404) {
      twitchClient.say(
        process.env.TWITCH_USERNAME,
        'No active device found. The streamer must be playing music to add a song to the queue.'
      )
    }
    return res
  } catch (error) {
    console.log(error)
  }
}

// this function allows the user to change the volume of the currently playing song
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

// this function will return the currently playing song
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
    return data
  } catch (error) {
    console.log(error)
  }
}

const getTrackLength = async (trackLink) => {
  if (typeof trackLink !== 'string') {
    console.error('trackLink must be a string')
    return
  }
  const user = await User.findOne({ twitchUsername: process.env.TWITCH_USERNAME })
  const trackIdOnly = trackLink.substring(trackLink.lastIndexOf(':') + 1)

  const getTrackLength = await fetch(`https://api.spotify.com/v1/tracks/${trackIdOnly}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${user.spotifyAccessToken}`,
    },
  })

  const trackLength = await getTrackLength.json()
  return trackLength.duration_ms
}

module.exports = {
  pauseSong,
  resumeSong,
  addToQueue,
  skipSong,
  changeVolume,
  currentSong,
  searchSong,
  getTrackLength,
}
