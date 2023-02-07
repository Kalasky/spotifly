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
    const res = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=5`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${user.spotifyAccessToken}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    console.log(data)

    let result = ''
    // concatenate the 5 search track names and links into the result string
    for (let i = 0; i < 5; i++) {
      result += `${i + 1}. ${data.tracks.items[i].name}\n`
      result += `${data.tracks.items[i].external_urls.spotify}\n`
    }

    twitchClient.say(process.env.TWITCH_USERNAME, result)
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
    console.log('addToQueue response status:', res.status)
    if (res.status === 204) {
      console.log('Successful request, no content to return.')
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
    switch (error.message) {
      case 'Error adding track to queue.':
        if (error.status !== 401) {
          twitchClient.say(
            process.env.TWITCH_USERNAME,
            'Invalid Spotify song link. Please try again. (Example: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=32cfb1adf4b942d9)'
          )
        }
        break
      case 404:
        twitchClient.say(process.env.TWITCH_USERNAME, 'No active device found.')
        break
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
