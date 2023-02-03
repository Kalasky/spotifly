const express = require('express')
const router = express.Router()
const crypto = require('crypto')

// import utils
const channelRewards = require('../utils/channelRewards')

// notifaction request headers for twitch
const TWITCH_MESSAGE_ID = 'Twitch-Eventsub-Message-Id'.toLowerCase()
const TWITCH_MESSAGE_TIMESTAMP = 'Twitch-Eventsub-Message-Timestamp'.toLowerCase()
const TWITCH_MESSAGE_SIGNATURE = 'Twitch-Eventsub-Message-Signature'.toLowerCase()
const MESSAGE_TYPE = 'Twitch-Eventsub-Message-Type'.toLowerCase()

// notification message types
const MESSAGE_TYPE_VERIFICATION = 'webhook_callback_verification'
const MESSAGE_TYPE_NOTIFICATION = 'notification'
const MESSAGE_TYPE_REVOCATION = 'revocation'

const HMAC_PREFIX = 'sha256='

router.post('/twitch/eventsub', async (req, res) => {
  let secret = getSecret()
  let message = getHmacMessage(req)
  let hmac = HMAC_PREFIX + getHmac(secret, message) // signature to compare

  if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
    console.log('signatures match')

    // get JSON object from request body
    let notification = req.body

    // check if message type is a notification
    if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
      switch (notification.event.reward.id) {
        case process.env.TWITCH_REWARD_ID_SPOTIFY:
          console.log(`Recieved ${notification.event.reward.title}`)
          channelRewards.addToSpotifyQueue()
          res.sendStatus(204)
          break
        case process.env.TWITCH_REWARD_ID_PENNY:
          console.log(`Recieved ${notification.event.reward.title}`)
          channelRewards.incrementCost()
          res.sendStatus(204)
          break
        case process.env.TWITCH_REWARD_ID_SKIP_SONG:
          console.log(`Recieved ${notification.event.reward.title}`)
          channelRewards.skipSpotifySong()
          res.sendStatus(204)
          break
        case process.env.TWITCH_REWARD_ID_VOLUME:
          console.log(`Recieved ${notification.event.reward.title}`)
          channelRewards.changeSpotifyVolume()
          res.sendStatus(204)
          break
        default:
          break
      }
    } else if (MESSAGE_TYPE_VERIFICATION === req.headers[MESSAGE_TYPE]) {
      res.status(200).send(notification.challenge)
    } else if (MESSAGE_TYPE_REVOCATION === req.headers[MESSAGE_TYPE]) {
      res.sendStatus(204)
    } else {
      res.sendStatus(204)
      console.log('unknown message type')
    }
  } else {
    res.sendStatus(403)
    console.log('signatures do not match')
  }
})

const getSecret = () => {
  return process.env.TWITCH_WEBHOOK_SECRET
}

const getHmacMessage = (req) => {
  let body = JSON.stringify(req.body)
  // concatenate the message id, timestamp, and body to create the message to sign
  return req.headers[TWITCH_MESSAGE_ID] + req.headers[TWITCH_MESSAGE_TIMESTAMP] + body
}

const getHmac = (secret, message) => {
  // create the HMAC using the secret and message and return the hex digest
  return crypto.createHmac('sha256', secret).update(message).digest('hex')
}

const verifyMessage = (hmac, signature) => {
  if (!hmac || !signature) {
    throw new Error('Both hmac and signature are required for message verification')
  }
  // compare the signatures using a constant time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
}

module.exports = router
