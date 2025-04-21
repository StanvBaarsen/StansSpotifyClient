// Serverless function for Spotify authentication
const axios = require('axios');

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Get action type from the path or query
    const params = event.queryStringParameters || {};
    const action = params.action || '';

    // Handle different actions
    switch (action) {
      case 'getCredentials':
        // Only return the client ID which is safe to expose
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            clientId: process.env.SPOTIFY_CLIENT_ID
          })
        };

      case 'getToken':
        // Exchange code for token (server-side only)
        if (!params.code) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing authorization code' })
          };
        }

        // Set up the token exchange with Spotify
        const tokenResponse = await axios({
          method: 'post',
          url: 'https://accounts.spotify.com/api/token',
          params: {
            grant_type: 'authorization_code',
            code: params.code,
            redirect_uri: params.redirect_uri || process.env.REDIRECT_URI,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(
              process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64')
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(tokenResponse.data)
        };

      case 'refreshToken':
        // Refresh an expired token (server-side only)
        if (!params.refresh_token) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing refresh token' })
          };
        }

        const refreshResponse = await axios({
          method: 'post',
          url: 'https://accounts.spotify.com/api/token',
          params: {
            grant_type: 'refresh_token',
            refresh_token: params.refresh_token,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(
              process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
            ).toString('base64')
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(refreshResponse.data)
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action parameter' })
        };
    }
  } catch (error) {
    console.error('Spotify auth error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      })
    };
  }
}; 