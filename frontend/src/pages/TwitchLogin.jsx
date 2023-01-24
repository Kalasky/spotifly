import React from 'react';

const TwitchLogin = () => {
    const handleLogin = async () => {
        // Redirect the user to the /twitch/login endpoint on your back-end
        // which will redirect them to Twitch's OAuth2 authorization endpoint
        window.location.href = 'http://localhost:8888/api/twitch/login';
    };

    return (
        <button onClick={handleLogin}>
            Log in with Twitch
        </button>
    );
};

export default TwitchLogin;