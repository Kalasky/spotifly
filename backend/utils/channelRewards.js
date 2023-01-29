const User = require('../models/User')
const { sendMessage } = require('../utils/tmiUtils')
const twitchUtils = require('../utils/twitchUtils')

const testCreation3 = async () => {
  const user = await User.findOne({ twitchId: process.env.TWITCH_CHANNEL })
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.TWITCH_BROADCASTER_ID}&reward_id=68f6ed85-0cb1-4498-a360-d11f95f1caea&status=UNFULFILLED`,
      {
        method: 'GET',
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${user.twitchAccessToken}`,
        },
      }
    )
    const data = await res.json()

    if (data.data.length > 0) {
      const username = data.data[0].user_login

      const chances = [
        { range: [1, 1], message: 'has won the 1/200000 chance to become a VIP for 1 year!' },
        { range: [2, 21], message: 'has won the 20/200000 chance to become a VIP for 6 months!' },
        { range: [22, 71], message: 'has won the 50/200000 chance for a 1 hour timeout!' },
        { range: [72, 571], message: 'has won the 500/200000 chance for a 5 minute timeout!' },
        { range: [572, 5572], message: 'has won the 5000/200000 chance to add or delete a 7TV emote!' },
      ]

      const chance = Math.floor(Math.random() * 200000) + 1
      console.log(chance)

      for (const option of chances) {
        if (chance >= option.range[0] && chance <= option.range[1]) {
          sendMessage(`@${username} ${option.message}`)
          break
        }
      }

      // update the status of the redemption to fulfilled
      twitchUtils.fulfillTwitchReward(
        process.env.TWITCH_CHANNEL,
        user.twitchAccessToken,
        user.twitchRefreshToken,
        process.env.TWITCH_CLIENT_ID,
        process.env.TWITCH_BROADCASTER_ID,
        process.env.TWITCH_REWARD_ID_TC3,
        data.data[0].id
      )
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  testCreation3,
}

