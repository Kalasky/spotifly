const mongoose = require('mongoose')

// create a schema for a spotify user
const ViewerSchema = new mongoose.Schema(
  {
    twitchUsername: String,
    playlists: [
      {
        playlistName: String,
        songs: [
          {
            link: String,
            name: String,
            artist: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
)

module.exports = mongoose.model('Viewer', ViewerSchema)
