const mongoose = require('mongoose')

// create a schema for a spotify user
const UserSchema = new mongoose.Schema(
  {
    discordId: String,
    discordUsername: String,
    discordDiscriminator: String,
    spotifyId: String,
    spotifyFollowers: Number,
    authorized: Boolean,
    isPremium: Boolean,
    accessToken: String,
    refreshToken: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
