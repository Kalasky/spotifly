const express = require('express')
const router = express.Router()
const qs = require('qs')
const User = require('../models/User')
const utils = require('../utils/twitchUtils')
const crypto = require('crypto')

// import utils
const twitchUtils = require('../utils/twitchUtils')
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
  console.log(`hmac: ${hmac}`, `signature: ${req.headers[TWITCH_MESSAGE_SIGNATURE]}`)

  if (true === verifyMessage(hmac, req.headers[TWITCH_MESSAGE_SIGNATURE])) {
    console.log('signatures match')

    // get JSON object from request body
    let notification = req.body

    // check if message type is a notification
    if (MESSAGE_TYPE_NOTIFICATION === req.headers[MESSAGE_TYPE]) {
      console.log(notification.subscription.type, notification.event)
      // check if the reward is from Spotify channel
      if (notification.event.reward.id === process.env.TWITCH_REWARD_ID_SPOTIFY) {
        console.log(`Notification type ${notification.subscription.type} received for ${notification.event.reward.title}.`)
        // run the queue function from twitchUtils
        twitchUtils.getNewRedemptionEvents(
          process.env.TWITCH_CHANNEL,
          process.env.TWITCH_CLIENT_ID,
          process.env.TWITCH_BROADCASTER_ID,
          process.env.TWITCH_REWARD_ID
        )
        res.sendStatus(204)
      }
      if (notification.event.reward.id === process.env.TWITCH_REWARD_ID_TC3) {
        console.log(`Notification type ${notification.subscription.type} received for ${notification.event.reward.title}.`)
        // run the test creation3 function from channelRewards Utils
        channelRewards.testCreation3()
        res.sendStatus(204)
      }
      if (notification.event.reward.id === process.env.TWITCH_REWARD_ID_PENNY) {
        console.log(`Notification type ${notification.subscription.type} received for ${notification.event.reward.title}.`)
        // run the incrementCost function from channelRewards Utils
        channelRewards.incrementCost()
        res.sendStatus(204)
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

router.get('/twitch/login', async (req, res) => {
  const scope = 'channel:manage:redemptions channel:read:redemptions channel:manage:vips chat:edit chat:read'

  res.redirect(
    307,
    'https://id.twitch.tv/oauth2/authorize?' +
      qs.stringify({
        response_type: 'code',
        client_id: process.env.TWITCH_CLIENT_ID,
        scope: scope,
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
      })
  )
})

let accessToken
let refreshToken

router.get('/twitch/callback', async (req, res) => {
  console.log('Twitch callback')
  // Get the authorization code from the query parameters
  const code = req.query.code
  const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: qs.stringify({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.TWITCH_REDIRECT_URI,
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
    }),
  })

  const tokenData = await tokenResponse.json()
  accessToken = tokenData.access_token
  refreshToken = tokenData.refresh_token

  const userResponse = await fetch('https://api.twitch.tv/helix/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Client-ID': process.env.TWITCH_CLIENT_ID,
    },
  })

  const userData = await userResponse.json()
  console.log(userData)
  const twitch_username = userData.data[0].login
  console.log(twitch_username)

  const user = await User.findOne({ twitchId: twitch_username })
  console.log(user)

  if (user) {
    utils.storeTwitchAccessToken(twitch_username, accessToken)
    utils.storeTwitchRefreshToken(twitch_username, refreshToken)
  } else {
    res.send('User not found. Please run the /setup discord command before logging in.')
  }
})

module.exports = router
