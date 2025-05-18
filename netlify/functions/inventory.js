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
  const locationId = event.queryStringParameters.locationId;

  if (!locationId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Location ID is required' })
    };
  }

  try {
    // Get catalog items
    const catalogResponse = await axios.get('https://connect.squareup.com/v2/catalog/list?types=ITEM', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Square-Version': '2023-09-25',
        'Content-Type': 'application/json'
      }
    });

    // Get inventory counts
    const inventoryResponse = await axios.get(`https://connect.squareup.com/v2/inventory/counts?location_ids=${locationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Square-Version': '2023-09-25',
        'Content-Type': 'application/json'
      }
    });

    // Return combined data
    return {
      statusCode: 200,
      body: JSON.stringify({
        catalog: catalogResponse.data,
        inventory: inventoryResponse.data
      })
    };
  } catch (error) {
    console.error('Error fetching inventory:', error.response ? error.response.data : error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch inventory data' })
    };
  }
};
