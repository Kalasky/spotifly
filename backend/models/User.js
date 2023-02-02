const mongoose = require('mongoose')

// create a schema for a spotify user
const UserSchema = new mongoose.Schema(
  {
    spotifyUsername: String,
    spotifyAccessToken: String,
    spotifyRefreshToken: String,
    twitchUsername: String,
    twitchAccessToken: String,
    twitchRefreshToken: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
