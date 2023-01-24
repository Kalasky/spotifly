const mongoose = require('mongoose')

// create a schema for a spotify user
const UserSchema = new mongoose.Schema(
  {
    discordId: String,
    discordUsername: String,
    discordDiscriminator: String,
    spotifyId: String,
    twitchId: String,
    spotifyFollowers: Number,
    authorized: Boolean,
    isPremium: Boolean,
    spotifyAccessToken: String,
    spotifyRefreshToken: String,
    twitchAccessToken: String,
    twitchRefreshToken: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
