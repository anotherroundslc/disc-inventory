const axios = require('axios');

exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Get access token from Authorization header
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Authorization token is required' })
    };
  }

  const token = authHeader.split(' ')[1];

  try {
    // Get merchant locations
    const response = await axios.get('https://connect.squareup.com/v2/locations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Square-Version': '2023-09-25',
        'Content-Type': 'application/json'
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Error fetching locations:', error.response ? error.response.data : error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch locations' })
    };
  }
};
