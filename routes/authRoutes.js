const express = require("express");
const router = express.Router();
const qs = require("qs");
const User = require("../models/User");

// this function will encode the data object into a query string for the fetch request
const encodeFormData = (data) => {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
    .join("&");
};
// this route will accept get requests at /api/login and redirect to the spotify login page
router.get("/login", async (req, res) => {
  const scope = `user-modify-playback-state
      user-read-playback-state 
      user-read-currently-playing
      user-library-modify
      user-library-read
      user-top-read
      playlist-read-private
      playlist-modify-public`;
  // redirect to spotify login page with the client id, redirect uri, and scope as query parameters
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
    qs.stringify({
      response_type: "code",
      client_id: process.env.SPOTIFY_CLIENT_ID,
      scope: scope,
      redirect_uri: process.env.REDIRECT_URI,
    })
  );
});

let accessToken;
let refreshToken;
// this route will accept get requests at /api/logged and redirect to the client redirect uri with the access token and refresh token as query parameters
router.get("/logged", async (req, res) => {
  const body = {
    grant_type: "authorization_code",
    code: req.query.code,
    redirect_uri: process.env.REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  };

  await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: encodeFormData(body), // encode the data object into a query string
  })
    .then((response) => response.json())
    .then((data) => {
      const query = qs.stringify(data); // convert the data object to a query string

      accessToken = query.split("&")[0].split("=")[1];
      refreshToken = query.split("&")[1].split("=")[1];

      console.log(
        "access token: ",
        accessToken + "\n" + "refresh token: ",
        refreshToken
      );

      // make fetch request to get user info
      fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          // extract user info from response
          const spotifyId = data.id;
          const spotifyFollowers = data.followers.total;

          // find the user in the database and update their spotify id and followers
          User.findOneAndUpdate(
            { spotifyId: spotifyId },
          ).then((user) => {
            user.spotifyId = spotifyId;
            user.spotifyFollowers = spotifyFollowers;
            user.save();
          }
          );
          // redirect to client redirect uri with the access token and refresh token as query parameters
          res.redirect(`${process.env.CLIENT_REDIRECT_URI}?${query}`);
        });
    });
});

module.exports = router;
module.exports.accessToken = accessToken;
module.exports.refreshToken = refreshToken;
