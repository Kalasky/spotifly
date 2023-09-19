const mongoose = require('mongoose')

// create a schema for a spotify user
const ViewerSchema = new mongoose.Schema(
  {
    twitchUsername: String,
  },
  { timestamps: true }
)

module.exports = mongoose.model('Viewer', ViewerSchema)
