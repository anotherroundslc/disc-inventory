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
    // Initialize Square client with your credentials
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production
    });

    const { catalogApi } = squareClient;

    // Get all catalog items to extract molds
    const catalogResponse = await catalogApi.listCatalog(
      undefined,
      "ITEM"
    );

    // Process the catalog to extract unique molds
    const molds = processCatalogForMolds(catalogResponse.result.objects || []);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        molds: molds
      }),
    };
  } catch (error) {
    console.error('Error fetching molds:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch mold data'
      }),
    };
  }
};

// Process catalog items to extract unique molds
function processCatalogForMolds(catalogItems) {
  // Set to track unique mold names
  const moldNames = new Set();
  // Array to hold mold objects
  const molds = [];
  
  // Process catalog items to extract molds
  catalogItems.forEach(item => {
    // Only process items, not categories or other catalog objects
    if (item.type !== 'ITEM' || !item.itemData) {
      return;
    }
    
    // Get mold name from custom attribute or use item name
    const moldName = getCustomAttribute(item.itemData.customAttributeValues, 'mold') || 
                    item.itemData.name;
    
    // Get vendor from custom attribute or use default
    const vendor = getCustomAttribute(item.itemData.customAttributeValues, 'vendor') || 'Unknown';
    
    // If this is a new mold, add it to the results
    if (moldName && !moldNames.has(moldName)) {
      moldNames.add(moldName);
      
      molds.push({
        name: moldName,
        vendor: vendor,
        parLevel: 15, // Default par level, can be overridden by local settings
        archived: false
      });
    }
  });
  
  return molds;
}

// Helper function to extract custom attributes
function getCustomAttribute(customAttributeValues, attributeName) {
  if (!customAttributeValues) return null;
  
  const attribute = customAttributeValues[attributeName];
  return attribute ? attribute.stringValue : null;
}
