// netlify/functions/square-status.js
const { Client, Environment } = require('square');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  try {
    // Initialize Square client
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production
    });

    // Test with a simple API call
    const locationsApi = squareClient.locationsApi;
    const locationResponse = await locationsApi.retrieveLocation(process.env.SQUARE_LOCATION_ID);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status: "connected",
        location: {
          id: locationResponse.result.location.id,
          name: locationResponse.result.location.name,
          status: locationResponse.result.location.status
        },
        message: "Your Square account is connected successfully! The app is currently running in demo mode while we finalize the integration."
      })
    };
  } catch (error) {
    console.error("Error checking Square status:", error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        status: "disconnected",
        error: error.message,
        message: "Could not connect to Square. Please check your credentials.",
        suggestions: [
          "Verify that SQUARE_ACCESS_TOKEN is correct",
          "Confirm that SQUARE_LOCATION_ID exists",
          "Make sure the token has the necessary permissions"
        ]
      })
    };
  }
};
