// netlify/functions/updateInventory.js
const { Client, Environment } = require('square');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight response' }),
    };
  }

  // Only allow POST requests for actual updates
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request data
    const requestData = JSON.parse(event.body);
    
    // Always return success in demo mode
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        simulated: true,
        message: "Demo mode: Inventory updated successfully (simulated)",
        details: "The system is running in demo mode while Square integration is being finalized."
      }),
    };
  } catch (error) {
    console.error('Error updating inventory:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        simulated: true,
        message: "Demo mode: Inventory updated successfully (simulated)",
        error: error.message
      }),
    };
  }
};
