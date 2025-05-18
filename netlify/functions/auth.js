const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Get code from query string
  const code = event.queryStringParameters.code;
  
  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Authorization code is required' })
    };
  }

  try {
    // Exchange code for access token
    const response = await axios.post('https://connect.squareup.com/oauth2/token', {
      client_id: process.env.SQUARE_APP_ID,
      client_secret: process.env.SQUARE_APP_SECRET,
      code: code,
      grant_type: 'authorization_code'
    });

    // Redirect to main app with token in URL fragment
    return {
      statusCode: 302,
      headers: {
        Location: `/${response.data.access_token}#dashboard`
      }
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error.response ? error.response.data : error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to exchange code for token' })
    };
  }
};
