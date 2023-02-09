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
    console.log(data)
    twitchClient.say(
      process.env.TWITCH_USERNAME,
      `Now playing: ${data.item.name} by: ${data.item.artists[0].name} Link: ${data.item.external_urls.spotify}`
    )
  } catch (error) {
    console.log(error)
  }
}

// this function will handle the process of creating/modifying a playlist for the user
const addTracksToPlaylist = async (twitchUsername, playlistName, link, name, artist) => {
  let viewer = await Viewer.findOne({ twitchUsername })

  if (!viewer) {
    // add the playlist to the viewer's document if it doesn't exist
    viewer = new Viewer({
      twitchUsername,
      playlists: [{ playlistName, songs: [{ link, name, artist }] }],
    })

    await viewer.save()
    twitchClient.say(process.env.TWITCH_USERNAME, `@${twitchUsername} has added ${name} to their ${playlistName} playlist!`)
  } else {
    // loop through the viewer's playlists and check if the playlist already exists
    const playlistExists = viewer.playlists.find((p) => p.playlistName === playlistName)

    if (!playlistExists && viewer.playlists.length >= 5) {
      twitchClient.say(process.env.TWITCH_USERNAME, `@${twitchUsername}, you already have 5 playlists, and cannot add any more.`)
      return
    }
    // check if the playlist that the user wants to add the song to has 100 songs in it
    if (playlistExists && playlistExists.songs.length >= 100) {
      twitchClient.say(
        process.env.TWITCH_USERNAME,
        `@${twitchUsername}, you already have 100 songs in your ${playlistName} playlist, and cannot add any more.`
      )
      return
    }

    // check if the playlist already exists for the user
    let playlist = viewer.playlists.find((p) => p.playlistName === playlistName)

    if (!playlist) {
      // add the playlist to the viewer's document if it doesn't exist
      playlist = { playlistName, songs: [{ link, name, artist }] }
      viewer.playlists.push(playlist)
    } else {
      // check if the song & artist is already in an object within the playlist
      const songExists = playlist.songs.find((s) => s.name === name && s.artist === artist)
      if (songExists) {
        twitchClient.say(process.env.TWITCH_USERNAME, `@${twitchUsername}, ${name} is already in your ${playlistName} playlist!`)
        return
      }

      playlist.songs.push({ link, name, artist })
    }

    await viewer.save()
    twitchClient.say(process.env.TWITCH_USERNAME, `@${twitchUsername} has added ${name} to their ${playlistName} playlist!`)
  }
}

// this function will play all songs in a playlist
const playAllTracksFromPlaylist = async (twitch_username, playlist_name) => {
  const viewer = await Viewer.findOne({ twitchUsername: twitch_username })

  if (viewer) {
    const playlist = viewer.playlists.find((playlist) => playlist.playlistName === playlist_name)
    if (playlist) {
      // add all songs to the queue
      playlist.songs.forEach(async (song) => {
        await addToQueue(song, twitch_username)
      })
      return
    }
    twitchClient.say(process.env.TWITCH_USERNAME, `@${twitch_username} you don't have a playlist named ${playlist_name}!`)
    return
  }
  twitchClient.say(
    process.env.TWITCH_USERNAME,
    `@${twitch_username} you need to create a playlist first. Type !atp <playlist_name> <song> to create a playlist.`
  )
}

module.exports = {
  pauseSong,
  resumeSong,
  addToQueue,
  skipSong,
  changeVolume,
  currentSong,
  searchSong,
  addTracksToPlaylist,
}
