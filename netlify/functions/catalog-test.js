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
    console.log("Starting catalog test function");
    console.log("Access token exists:", !!process.env.SQUARE_ACCESS_TOKEN);
    console.log("Location ID:", process.env.SQUARE_LOCATION_ID);
    
    // Initialize Square client
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production
    });

    console.log("Square client initialized");
    const catalogApi = squareClient.catalogApi;
    
    // Test with a simple API call that doesn't return BigInt values
    console.log("Getting merchant info");
    const merchantApi = squareClient.merchantsApi;
    const merchantResponse = await merchantApi.retrieveMerchant("me");
    
    console.log("Merchant info retrieved");
    const merchantInfo = merchantResponse.result.merchant;
    
    // Get first 10 catalog items - avoiding BigInt issues
    console.log("Getting catalog info");
    const catalogResponse = await catalogApi.listCatalog(
      undefined,
      "ITEM"
    );
    
    console.log("Catalog response received");
    
    // Safe stringify function to handle BigInt values
    const safeStringify = (obj) => {
      return JSON.stringify(obj, (key, value) => {
        // Convert any BigInt to string
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });
    };
    
    // Count items without processing them
    const itemCount = catalogResponse.result.objects ? 
      catalogResponse.result.objects.filter(obj => obj.type === 'ITEM').length : 0;
    
    console.log(`Found ${itemCount} catalog items`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        merchant: {
          id: merchantInfo.id,
          businessName: merchantInfo.businessName,
          country: merchantInfo.country,
          languageCode: merchantInfo.languageCode
        },
        catalogSummary: {
          totalItems: itemCount,
          message: "Your Square account is connected successfully!"
        }
      })
    };
  } catch (error) {
    console.error("Error in catalog test:", error);
    
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
