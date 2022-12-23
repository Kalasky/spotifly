const bcrypt = require("bcrypt")
const User = require("./models/User")

// this function will encode the data object into a query string for the fetch request
const encodeFormData = (data) => {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&")
}

// this function will securely store the access token in the database
const storeAccessToken = async (userId, accessToken) => {
  await User.findOneAndUpdate(userId, { accessToken: accessToken })
}

// this function will securely store the refresh token in the database
const storeRefreshToken = async (userId, refreshToken) => {
  await User.findOneAndUpdate(userId, { refreshToken: refreshToken })
}

// verify the user's access token
const verifyAccessToken = async (userId, accessToken) => {
  const storedToken = await User.findOneAndUpdate(userId, accessToken)
  const isMatch = bcrypt.compare(accessToken, storedToken)
  return isMatch
}

// this function will generate a new access token if the user's access token has expired
const generateAccessToken = async (userId, refreshToken) => {
  const storedToken = await User.findOneAndUpdate(userId, refreshToken)

  const newToken = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString(
          "base64"
        ),
    },
    body: encodeFormData({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })
    .then((res) => res.json())
    .then((data) => data.access_token)
  await storeAccessToken(userId, newToken)
  return newToken
}

// this function will refresh the user's access token if it has expired
const refreshAccessToken = async (userId, refreshToken) => {
  const newToken = generateAccessToken(userId, refreshToken)
  return newToken
}

// --------------------- PLAYBACK FUNCTIONS ---------------------

// this function will pause the user's currently playing song
const pauseSong = async (userId, accessToken, refreshToken) => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.statusText === "Unauthorized") {
      const newToken = await refreshAccessToken(userId, refreshToken)
      await pauseSong(userId, newToken)
    }

    return response
  } catch (error) {
    console.log(error)
  }
}

// this function will resume the user's currently playing song
const resumeSong = async (userId, accessToken) => {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.statusText === "Unauthorized") {
      const newToken = await refreshAccessToken(userId, refreshToken)
      await resumeSong(userId, newToken)
    }
    return response
  } catch (error) {
    console.log(error)
  }
}

module.exports = {
  storeAccessToken,
  storeRefreshToken,
  verifyAccessToken,
  generateAccessToken,
  refreshAccessToken,
  pauseSong,
  resumeSong,
  encodeFormData,
}
