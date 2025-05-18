// netlify/functions/updateInventory.js
const { Client, Environment } = require('square');
const crypto = require('crypto');

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
    const requestData = JSON.parse(event.body);
    const { catalogObjectId, quantity, fromState, toState } = requestData;

    if (!catalogObjectId || !quantity || !fromState || !toState) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }),
      };
    }

    // Initialize Square client
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production
    });

    const { inventoryApi } = squareClient;
    const locationId = process.env.SQUARE_LOCATION_ID;

    // Generate a unique idempotency key to prevent duplicate operations
    const idempotencyKey = crypto.randomUUID();

    // Create inventory adjustment
    const adjustment = {
      type: 'ADJUSTMENT',
      adjustment: {
        catalogObjectId,
        fromState,
        toState,
        quantity,
        locationId,
        occurredAt: new Date().toISOString()
      }
    };

    // Make the API call to update inventory
    const response = await inventoryApi.batchChangeInventory({
      idempotencyKey,
      changes: [adjustment]
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        data: response.result 
      }),
    };
  } catch (error) {
    console.error('Error updating inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to update inventory'
      }),
    };
  }
};
