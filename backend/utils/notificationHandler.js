const channelRewards = require('./channelRewards');

module.exports.handleReward = (rewardId, notification) => {
  switch (rewardId) {
    case process.env.TWITCH_REWARD_ID_SPOTIFY:
      console.log(`Received ${notification.event.reward.title}`);
      channelRewards.addToSpotifyQueue();
      break;
    case process.env.TWITCH_REWARD_ID_PENNY:
      console.log(`Received ${notification.event.reward.title}`);
      channelRewards.incrementCost();
      break;
    case process.env.TWITCH_REWARD_ID_SKIP_SONG:
      console.log(`Received ${notification.event.reward.title}`);
      channelRewards.skipSpotifySong();
      break;
    case process.env.TWITCH_REWARD_ID_VOLUME:
      console.log(`Received ${notification.event.reward.title}`);
      channelRewards.changeSpotifyVolume();
      break;
    case process.env.TWITCH_REWARD_ID_PLAY_PLAYLIST:
      console.log(`Received ${notification.event.reward.title}`);
      channelRewards.playUserPlaylist();
      break;
    default:
      break;
  }
};