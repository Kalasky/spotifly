<!-- PROJECT LOGO -->
<br />
<div id="top" align="center">
  <a href="https://github.com/github_username/repo_name">
    <img src="images/music-folder.png" alt="Logo" width="80" height="80">
  </a>

<h1 align="center">Spotifly</h1>

 > Having Spotify Premium is __crucial__ for this bot to function optimally.
  <p align="center">
    Introducing Spotifly, the Twitch Spotify Bot that lets viewers control playback, search tracks, add to queue, see current song, and skip songs. Spotifly brings a new level of interactivity to Twitch streams, making music a shared experience. Future updates will add even more features to Spotifly, making it the go-to tool for streamers and viewers looking to enhance their musical experience on Twitch.
    <br />
    <a href="https://discord.gg/HpAB5ymCgc"><strong>Join the Discord! »</strong></a>
    <br />
    <br />
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
            <ul>
        <li><a href="#visual-studio-code">Visual Studio Code</a></li>
      </ul>
        <ul>
        <li><a href="#git">Git</a></li>
        </ul>
            <ul>
        <li><a href="#nodejs">Node.js</a></li>
      </ul>
      </ul>
            <ul>
        <li><a href="#spotify-developer-account">Spotify Developer Account</a></li>
      </ul>
      </ul>
            <ul>
        <li><a href="#twitch-developer-account">Twitch Developer Account</a></li>
      </ul>
      <ul>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
    <a href="#configuration">Configuration</a>
          <ul>
        <li><a href="#spotify">Spotify</a></li>
      </ul>
            <ul>
        <li><a href="#mongodb">MongoDB</a></li>
      </ul>
            <ul>
        <li><a href="#twitch">Twitch</a></li>
      </ul>
            <ul>
        <li><a href="#twitch-webhook">Twitch Webhook</a></li>
      </ul>
    </li>
    <li><a href="#okay-im-done-now-what">Okay I'm Done! Now What?</a></li>
    <li><a href="#process">Process For Starting & Ending Stream</a></li>
    <li><a href="#accessrefresh">Access & Refresh Token Handling</a></li>
    <li><a href="#updates">Updates</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#show-your-support">Show Your Support</a></li>
  </ol>
</details>
<br />
<br />

## Support The Project

Spotifly is free to use, but if you appreciate the work that went into this project and would like to support its continued development, please consider making a [donation](https://streamlabs.com/kalaskyyy/tip). Your support is greatly appreciated and will help keep Spotifly going. Thank you!
<br />
<br />

## NOTICE

> <i> The setup process for Spotifly has a lot of moving parts, but I have tried to make the process as easy as possible. If you have any questions or need help, please join the [Discord](https://discord.gg/HpAB5ymCgc) and ask for help in the #help-1 or #help-2 channel. I will be happy to help you get Spotifly up and running. If you have a development environment already up and running on your PC then this setup should feel familiar.<br /><br />With that out of the way, let's get started!</i>

<!-- GETTING STARTED -->

## Getting Started

To get the project up and running locally, follow the steps below.

> To make the installation process go by swiftly, let's install Scoop. Scoop is a command-line installer for Windows that makes it easy to install and update many popular command-line tools and applications. It is similar to Homebrew on macOS and Linux. If you already have scoop installed, you can skip this step. <br /><br /> Open up windows powershell and run the following two command to install scoop:

```sh
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb get.scoop.sh | iex
```
> You will need to enter "Y" to confirm the installation of scoop.

<br />

# Install the following tools in Windows Powershell:

1. ### Git:

- ```sh
    scoop install git
  ```
- c. Once Git is installed, run the following command to confirm that Git is installed: `git --version`

2. ### Visual Studio Code:

- ```sh
    scoop bucket add extras
    scoop install vscode
  ```
- c. Once Visual Studio Code is installed, run the following command to confirm that Visual Studio Code is installed: `code --version`

3. ### Node.js:

- ```sh
    scoop install nodejs
  ```
- c. Once Node.js is installed, run the following command to confirm that Node.js is installed: `node -v`<br /><br />

4. ### Spotify Developer Account:

- a. Go to the Spotify Developer website (https://developer.spotify.com/dashboard/) and click on the "Log In" button.
- b. Click on the "Create an App" button and enter an app name and description of your choice.
- c. Click on the "Edit Settings" button and add the following URLs to the "Redirect URIs" section: http://localhost:8888/api/spotify/callback
- d. Click on the "Save" button.
- e. Click on the "Show Client Secret" button and copy the Client ID and Client Secret to a notepad. You will need these later.<br /><br />

5. ### Twitch Developer Account:

- a. Go to the Twitch Developer Console (https://dev.twitch.tv/console) and click on the "Register Your Application" button.
- b. Enter any name for your application
- c. Enter the following URL for the OAuth Redirect URL:
  http://localhost:8888/api/twitch/callback
- d. Select the "Chat Bot" category then click on the "Create" button.
- e. Click on the "Manage" button and copy the Client ID and Client Secret (`"New Secret" button`) to the same notepad you used for the Spotify Client ID and Client Secret. You will need these later.

## Installation

1. Clone the project repository:

- Open windows powershell and navigate to the directory where you want to clone the project. It is recommended you make a folder named code or something similar to clone the project into. Then, run the following command:

  ```sh
  git clone https://github.com/Kalasky/spotifly.git
  ```
> If you cannot clone the project, try running powershell as an administrator.
2. Navigate to the project directory:

   ```sh
    cd spotifly/backend
   ```

3. Install dependencies:

- To install the project dependencies, run the following command (make sure you are in `/spotifly/backend` directory when running this command):

  ```sh
  npm install
  ```

4. Open the project in Visual Studio Code:

- To open the project in Visual Studio Code, run the following command:

  ```sh
  code .
  ```

  > You can open a new terminal in Visual Studio Code by pressing `` Ctrl + `  `` or by clicking on the "Terminal" tab and then clicking on the "New Terminal" button. This way you don't have to keep switching back and forth between windows powershell and Visual Studio Code.

5. Setup your database:

- a. Visit https://account.mongodb.com/account/login and log in or setup your MongoDB account.
  > If this is your first time making an account with Mongo Atlas, choose Javascript as your preferred language.
- b. Click on the "Create" button. Select the "Shared" option. Use AWS for the cloud provider. Select the "Free" option for the cluster tier, it should be the default "M0 Sandbox". Click on the "Create Cluster" button.
  - You will be prompted to make a database user. You can put anything for the user name, but usually you just put it as "admin". For the password, you can use a password generator to generate a secure password. Make sure to save the password somewhere safe. You will need it later.
  - You will be prompted to add an IP address. You can add your current IP address.
- c. Once the cluster is created, click on the "Connect" button. Click on the "Connect Your Application" button. Copy the connection string and save it to a notepad. You will need this later. `Make sure the connection string is for the node.js driver.`

<!-- CONFIGURATION -->

## Configuration

1. Locate the .env.example file in Visual Studio Code `where all the files are on the left side` and rename it to `.env`
> Just to reiterate, rename the `.env.example` file to `.env`. If you don't do this, the project will not work.
2. Open the `.env` file and enter the following information:

### Spotify

- `SPOTIFY_USERNAME`: Your Spotify username __MAKE SURE IT IS ALL LOWERCASE__
- `SPOTIFY_CLIENT_ID`: The Client ID you copied in your notepad from the Spotify Developer Dashboard
- `SPOTIFY_CLIENT_SECRET`: The Client Secret you copied in your notepad from the Spotify Developer Dashboard
- `SPOTIFY_REDIRECT_URI`: http://localhost:8888/api/spotify/callback

### MongoDB

- `MONGODB_URI`: The connection string you copied from the MongoDB website. Replace the `<password>` with the password you set for your MongoDB account. REMOVE THE `< >` FROM THE PASSWORD.

### Twitch

- `TWITCH_BOT_USERNAME`: The name you set for the Twitch application
- `TWITCH_USERNAME`: Your Twitch username __MAKE SURE IT IS ALL LOWERCASE__
- `TWITCH_BROADCASTER_ID`: Your Twitch broadcaster ID, you can find your broadcaster ID by running the `!dr` command mentioned below. Please note that you will need to run the `!dr` command after you have <strong>finished</strong> setting up the bot. So `come back` to this step later.
- `TWITCH_BOT_TOKEN`: Get your bot token at: https://twitchapps.com/tmi/
- `TWITCH_CLIENT_ID`: The Client ID you copied in your notepad from the Twitch Developer Console
- `TWITCH_CLIENT_SECRET`: The Client Secret you copied in your notepad from the Twitch Developer Console
- `TWITCH_REDIRECT_URI`: http://localhost:8888/api/twitch/callback

#### To retrieve the reward IDs, run the `!dr` command in your Twitch chat. The reward IDs will be displayed in the console.<br />

> Only run the `!dr` command after you have <strong>finished</strong> setting up the bot! So `come back` to this step later.
> <br />

##### Example output:

```sh
[2021-05-01T23:00:00.000Z] [INFO] - Reward ID: 12345678-1234-1234-1234-123456789012
[2021-05-01T23:00:00.000Z] [INFO] - Reward ID: 12345678-1234-1234-1234-123456789012
[2021-05-01T23:00:00.000Z] [INFO] - Reward ID: 12345678-1234-1234-1234-123456789012
[2021-05-01T23:00:00.000Z] [INFO] - Reward ID: 12345678-1234-1234-1234-123456789012
```

- `TWITCH_REWARD_ID_SPOTIFY`: Reward ID goes here
- `TWITCH_REWARD_ID_PENNY`: Reward ID goes here
- `TWITCH_REWARD_ID_SKIP_SONG`: Reward ID goes here
- `TWITCH_REWARD_ID_VOLUME`: Reward ID goes here

#### Twitch Webhook

- `TWITCH_WEBHOOK_SECRET`: The secret must be an ASCII string that’s a minimum of `10` characters long and a maximum of `100` characters long. You can use a simple string like, “this is my secret”; however, you should consider using a random byte generator meant for cryptography. First, let's install openssl:

```sh
scoop install openssl
```

- Then, run the following command to generate a random string:

```sh
openssl rand -hex 32
```

- Copy the output and paste it into the .env file for the TWITCH_WEBHOOK_SECRET variable.

- `APP_ACCESS_TOKEN`: This is the access token for the Twitch application, and is not the same as the user access token. You can get the applications access token by setting up a Twitch CLI.

- We will be using scoop to install the Twith CLI. You should have scoop installed already if you have been following along with the guide.

```sh
scoop bucket add twitch https://github.com/twitchdev/scoop-bucket.git
scoop install twitch-cli
```

- To upgrade the Twitch CLI, run the following command:

```sh
scoop update twitch-cli
```

- Before you can use the Twitch CLI, you must configure it with your application’s client ID and secret that you should have saved in a notepad or somewhere else.
- To configure the Twitch CLI, run the following command:

```sh
twitch configure
```

- You will be prompted to enter the client ID and secret. Enter the client ID and secret you copied from the Twitch Developer Console.

- To get the application’s access token, run the following command:

```sh
twitch token
```

- Copy the access token and paste it into the .env file.

- `NGROK_TUNNEL_URL` : The URL you get from ngrok. Install ngrok with the following command:

```sh
scoop install ngrok
```
> In order for the ngrok tunnel to work you NEED to make an ngrok account. You can do that here: https://dashboard.ngrok.com/signup <br />Once you have signed up, go to the Setup & Installation tab. There will be a "Connect your account" section with a command for you to copy and paste into your terminal. The command should look somethinglike this: ```ngrok config add-authtoken 1YgrFEE4zSTHGDHDGdjghgDHGdG```<br />Once you have done that, you can run the following command to start ngrok:

```sh
ngrok http 8888
```

- Copy the URL that starts with https and paste it into the .env file.
  Here is an example of what the URL should look like:

```sh
https://5d0b-123-456-789-123.ngrok.io
```

# Okay I'm Done! Now What?

- Visit http://localhost:8888/api/twitch/login to login to Twitch. Your Twitch access token and refresh token should now be logged directly into the MongoDB database.
- Then visit http://localhost:8888/api/spotify/login to login to Spotify. The spotify access token and refresh token should now be logged directly into the MongoDB database.
- Now you can run the command `!dr` in your Twitch chat to get the reward IDs. The reward IDs will be displayed in the console. As well as your broadcaster ID!
- Once the channel rewards have been created, feel free to modify them in your creator dashboard, it won't affect the bot.
  <br /><br />

# <div id="process">Process for Starting & Ending Stream</div>

- Okay, so you want to start you stream for the day. First, start the ngrok tunnel by running the command `ngrok http 8888` in a terminal. Second, paste the https string into the .env file for the `NGROK_TUNNEL_URL` variable. Third, in the `/spotifly/backend` directory, run `node index.js` to start the bot. Fourth, run the command `!ces` in your twitch chat to create the event subscriptions for the rewards you already created before with `!dr` Fifth, Have a good stream :)
- Now you want to end stream, first run the command `!des` in your twitch chat to delete the event subscriptions. Second, stop the ngrok tunnel by pressing `ctrl + c` in the terminal. Third, stop the bot by pressing `ctrl + c` in the terminal. That's it!

- **NOTICE**: Before every stream you must run the ngrok tunnel and paste in the **new** https string into the `.env` file for the `NGROK_TUNNEL_URL` variable. Then don't forget to run `!ces` in your twitch chat to create the event subscriptions, since you deleted them with `!des` at the end of your last stream.
- Rinse and repeat! Once you get the flow down, starting and ending stream will be a breeze.
- Side note: You don't necissarily have to terminate the ngrok tunnel everytime you end stream. If you still have the same tunnel running since last stream, don't worry about pasting in a new https string into the `.env` file.
  <br /><br />

> If you encounter any issues, join the [Discord](https://discord.gg/HpAB5ymCgc) server and ask for help. I will be happy to help you out. When asking for help, please provide as much information as possible. For example, what error message you are getting, what you have tried so far, etc.

<br /> <br />

# <div id="accessrefresh">Access & Refresh Tokens</div>

- I implemented a refresh token system for both Spotify and Twitch. So if your access token expires mid stream, the bot will automatically refresh the token for you. You don't have to worry about anything. Refresh tokens last for a decent bit of time, but when it does expire, the bot will notify you directly in chat telling you to have a look at the console. Then just visit the two login pages to get new access tokens and refresh tokens. The database will automatically update the new tokens for you, no need to termiate the bots session, just continue on with the stream!
  <br /> <br />

# <div id="updates">Updates</div>

- I will continue to update this bot wih new features and bug fixes. Join the [Discord](https://discord.gg/HpAB5ymCgc) server to stay up to date with the latest updates.
- Feel free to suggest new features that you think would be cool! It doesn't **need** to be spotify related. I am open to any ideas.
- When a new feature is released, you will be notified in the Discord server.
- To update the bot to the latest version, run the following command in the `/spotifly/backend` directory:

```sh
git pull origin main
```

- And whala! You are now up to date with the latest version of the bot.
  <br /> <br />
  # <div id="contributing">Contributing</div>
  Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.
  <br /><br />
- If you would like to contribute to this project, feel free to fork the repo and make a pull request. I will review the pull request and merge it if I think it is a good addition to the project.
- If you decide on contributing, `please make an effort` to follow the same flow that the codebase is currently using. For example, if you are adding a new feature, try to follow the same flow as the other features. If you are adding a new command, try to follow the same flow as the other commands. This will make it easier for me to review the pull request and merge it. Happy coding!
  <br /><br />

## Show Your Support!

  <a href="https://streamlabs.com/kalaskyyy/tip">
    <img src="images/donate.png" alt="Logo" width="100" height="100">
  </a>
