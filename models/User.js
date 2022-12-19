const mongoose = require('mongoose')

// create a schema for a spotify user
const UserSchema = new mongoose.Schema(
  {
    discordId: String,
    discordUsername: String,
    discordDiscriminator: String,
    discordAvatar: String,
    discordConnections: String,
    spotifyId: String,
    spotifyUsername: String,
    spotifyCountry: String,
    spotifyPremium: Boolean,
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', UserSchema)
