// netlify/functions/catalog-test.js
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

    const catalogApi = squareClient.catalogApi;
    
    // Get first 10 catalog items
    const catalogResponse = await catalogApi.listCatalog(
      undefined,
      "ITEM"
    );
    
    // Extract simplified info
    const itemSummaries = [];
    if (catalogResponse.result.objects) {
      catalogResponse.result.objects.slice(0, 10).forEach(item => {
        if (item.type === 'ITEM' && item.itemData) {
          const variations = [];
          
          if (item.itemData.variations) {
            item.itemData.variations.forEach(variation => {
              if (variation.itemVariationData) {
                variations.push({
                  id: variation.id,
                  name: variation.itemVariationData.name,
                  sku: variation.itemVariationData.sku || null,
                  price: variation.itemVariationData.priceMoney ? 
                    variation.itemVariationData.priceMoney.amount / 100 : 0
                });
              }
            });
          }
          
          itemSummaries.push({
            id: item.id,
            name: item.itemData.name,
            description: item.itemData.description || "",
            variations: variations
          });
        }
      });
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_items: catalogResponse.result.objects ? catalogResponse.result.objects.length : 0,
        samples: itemSummaries,
        message: "This shows a sample of your Square catalog items. Use this to see how your items are structured."
      })
    };
  } catch (error) {
    console.error("Error fetching catalog:", error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: "Could not fetch Square catalog. Check your credentials and try again."
      })
    };
  }
};
