const mongoose = require('mongoose')

// create a schema for a spotify user
const UserSchema = new mongoose.Schema(
  {
    discordId: String,
    discordUsername: String,
    discordDiscriminator: String,
    spotifyId: String,
    spotifyFollowers: Number,
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
