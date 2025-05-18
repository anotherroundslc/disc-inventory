// netlify/functions/getVendors.js
const { Client, Environment } = require('square');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight response' }),
    };
  }

  try {
    // Return default vendors for now
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        vendors: getDefaultVendors(),
        mode: "demo"
      }),
    };
  } catch (error) {
    console.error('Error in function:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        vendors: getDefaultVendors(),
        error: error.message
      }),
    };
  }
};

// Get default vendors
function getDefaultVendors() {
  return [
    { name: 'Innova', leadTime: 7 },
    { name: 'Discraft', leadTime: 7 },
    { name: 'MVP', leadTime: 14 },
    { name: 'Dynamic Discs', leadTime: 10 },
    { name: 'Latitude 64', leadTime: 10 },
    { name: 'Westside', leadTime: 10 }
  ];
}
