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
    // Initialize Square client with your credentials
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production
    });

    const catalogApi = squareClient.catalogApi;

    try {
      // Get all catalog items to extract vendors
      const catalogResponse = await catalogApi.listCatalog(
        undefined,
        "ITEM"
      );

      // Process the catalog to extract unique vendors
      const vendors = processCatalogForVendors(catalogResponse.result.objects || []);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          vendors: vendors
        }),
      };
    } catch (apiError) {
      console.error('Square API error:', apiError);
      
      // Return default vendors in case of API error
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          vendors: getDefaultVendors()
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
        vendors: getDefaultVendors()
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

// Process catalog items to extract unique vendors
function processCatalogForVendors(catalogItems) {
  // Set to track unique vendor names
  const vendorNames = new Set();
  // Array to hold vendor objects
  const vendors = [];
  
  // Process catalog items
  catalogItems.forEach(item => {
    // Only process items, not categories or other catalog objects
    if (item.type !== 'ITEM' || !item.itemData) {
      return;
    }
    
    // Get vendor from custom attribute
    const vendorName = getCustomAttribute(item.itemData.customAttributeValues, 'vendor');
    
    // If we have a vendor and it's new, add it to the results
    if (vendorName && !vendorNames.has(vendorName)) {
      vendorNames.add(vendorName);
      
      vendors.push({
        name: vendorName,
        leadTime: 7 // Default lead time, can be overridden by local settings
      });
    }
  });
  
  // If no vendors were found in catalog, add some defaults
  if (vendors.length === 0) {
    return getDefaultVendors();
  }
  
  return vendors;
}

// Helper function to extract custom attributes
function getCustomAttribute(customAttributeValues, attributeName) {
  if (!customAttributeValues) return null;
  
  const attribute = customAttributeValues[attributeName];
  return attribute ? attribute.stringValue : null;
}
