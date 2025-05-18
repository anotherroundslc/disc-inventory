// netlify/functions/getInventory.js
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

    const { inventoryApi, catalogApi } = squareClient;
    const locationId = process.env.SQUARE_LOCATION_ID; // Your Square location ID

    // Get inventory counts for the location
    const inventoryResponse = await inventoryApi.retrieveInventoryCounts({
      locationIds: [locationId],
    });

    // Get catalog items (discs)
    const catalogResponse = await catalogApi.listCatalog(
      undefined,
      "ITEM"
    );

    // Process the responses to create a combined inventory view
    const processedInventory = processCatalogAndInventory(
      catalogResponse.result.objects || [],
      inventoryResponse.result.counts || []
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        inventory: processedInventory
      }),
    };
  } catch (error) {
    console.error('Error fetching inventory:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to fetch inventory data'
      }),
    };
  }
};

// Process catalog and inventory data to create a combined view
function processCatalogAndInventory(catalogItems, inventoryCounts) {
  // Extract items and their variations from catalog
  const discs = [];
  
  // First, organize inventory counts by catalog object ID for easy lookup
  const inventoryMap = {};
  inventoryCounts.forEach(count => {
    if (count.state === 'IN_STOCK') {
      inventoryMap[count.catalogObjectId] = count.quantity;
    }
  });
  
  // Process catalog items (discs)
  catalogItems.forEach(item => {
    // Only process items, not categories or other catalog objects
    if (item.type !== 'ITEM' || !item.itemData) {
      return;
    }
    
    // Extract custom attributes for mold, plastic, etc.
    const customAttributes = {};
    if (item.itemData.variations) {
      // Process each variation (could be different weights, colors, etc. of the same disc)
      item.itemData.variations.forEach(variation => {
        if (!variation.itemVariationData) return;
        
        // Extract variation specific attributes
        const plastic = getCustomAttribute(variation.itemVariationData.customAttributeValues, 'plastic') || 
                        getCustomAttribute(item.itemData.customAttributeValues, 'plastic') || 
                        'Unknown';
                        
        const mold = getCustomAttribute(item.itemData.customAttributeValues, 'mold') ||
                    item.itemData.name ||
                    'Unknown';
        
        const vendor = getCustomAttribute(item.itemData.customAttributeValues, 'vendor') ||
                      getCustomAttribute(variation.itemVariationData.customAttributeValues, 'vendor') ||
                      'Unknown';
        
        // Get current stock
        const stock = inventoryMap[variation.id] ? parseInt(inventoryMap[variation.id]) : 0;
        
        // Get price
        const price = variation.itemVariationData.priceMoney ? 
                    variation.itemVariationData.priceMoney.amount / 100 : 
                    0;
        
        // Create disc entry
        discs.push({
          id: variation.id,
          name: `${plastic} ${mold}${variation.itemVariationData.name ? ' ' + variation.itemVariationData.name : ''}`,
          sku: variation.itemVariationData.sku || '',
          stock: stock,
          price: price,
          vendor: vendor,
          plastic: plastic,
          mold: mold,
          // We don't have actual sales data, but these fields are expected by your frontend
          sales30: 0,
          sales90: 0,
          variationName: variation.itemVariationData.name || '',
          itemId: item.id
        });
      });
    }
  });
  
  return discs;
}

// Helper function to extract custom attributes
function getCustomAttribute(customAttributeValues, attributeName) {
  if (!customAttributeValues) return null;
  
  const attribute = customAttributeValues[attributeName];
  return attribute ? attribute.stringValue : null;
}
