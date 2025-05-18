// netlify/functions/getMolds.js
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
    // Return default molds for now
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        molds: getDefaultMolds(),
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
        molds: getDefaultMolds(),
        error: error.message
      }),
    };
  }
};

// Get default molds
function getDefaultMolds() {
  return [
    { name: 'Destroyer', vendor: 'Innova', parLevel: 15, archived: false },
    { name: 'Zone', vendor: 'Discraft', parLevel: 15, archived: false },
    { name: 'Envy', vendor: 'MVP', parLevel: 15, archived: false },
    { name: 'Wraith', vendor: 'Innova', parLevel: 15, archived: false },
    { name: 'Mako3', vendor: 'Innova', parLevel: 15, archived: false },
    { name: 'Undertaker', vendor: 'Discraft', parLevel: 15, archived: false }
  ];
}
