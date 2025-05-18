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

    const catalogApi = squareClient.catalogApi;

    try {
      // Get all catalog items to extract molds
      const catalogResponse = await catalogApi.listCatalog(
        undefined,
        "ITEM"
      );

      // Process the catalog to extract unique molds
      const molds = extractMoldsFromCatalog(catalogResponse.result.objects || []);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          molds: molds
        }),
      };
    } catch (apiError) {
      console.error('Square API error:', apiError);
      
      // Return default molds in case of API error
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          molds: getDefaultMolds()
        }),
      };
    }
  } catch (error) {
    console.error('Error in function:', error);
    
    return {
      statusCode: 200, // Using 200 instead of 500 to handle errors gracefully
      headers,
      body: JSON.stringify({ 
        success: true, 
        molds: getDefaultMolds()
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
    { name: 'Wraith', vendor: 'Innova', parLevel: 15, archived: false }
  ];
}

// Common disc golf vendors
const knownVendors = [
  "Innova", "Discraft", "Dynamic Discs", "MVP", "Axiom", "Streamline", 
  "Latitude 64", "Westside", "Prodigy", "Gateway", "Kastaplast", "Discmania"
];

// Extract molds from catalog items
function extractMoldsFromCatalog(catalogItems) {
  // Set to track unique mold names
  const moldNames = new Set();
  // Array to hold mold objects
  const molds = [];
  
  // Process catalog items
  catalogItems.forEach(item => {
    // Only process items, not categories or other catalog objects
    if (item.type !== 'ITEM' || !item.itemData) {
      return;
    }
    
    // Item name is likely to be the mold
    const moldName = item.itemData.name;
    
    // Determine vendor from name
    let vendor = "Unknown";
    for (const knownVendor of knownVendors) {
      if (moldName.includes(knownVendor)) {
        vendor = knownVendor;
        break;
      }
    }
    
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
  
  // If no molds found, return defaults
  if (molds.length === 0) {
    return getDefaultMolds();
  }
  
  return molds;
}
