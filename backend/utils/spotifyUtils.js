const { sendMessage } = require('./tmiUtils')

// --------------------- PLAYBACK FUNCTIONS ---------------------

// this function will pause the user's currently playing song
const pauseSong = async (userId, accessToken, refreshToken) => {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return res
  } catch (error) {
    console.log(error)
  }
}

// this function will resume the user's currently playing song
const resumeSong = async (userId, accessToken, refreshToken) => {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    return res
  } catch (error) {
    console.log(error)
  }
}

// this function will add a song to the user's queue
const addToQueue = async (userId, accessToken, refreshToken, uri) => {
  try {
    let res = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${uri}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    return res
  } catch (error) {
    console.log(error)
    if (error.message === 'Error adding track to queue.' && error.status !== 401) {
      sendMessage('Invalid Spotify song link. Please try again. (Example: https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=32cfb1adf4b942d9)')
    }
  }
}

module.exports = {
  pauseSong,
  resumeSong,
  addToQueue,
}
