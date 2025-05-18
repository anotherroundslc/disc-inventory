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
    console.log("Initializing Square client");
    
    // Initialize Square client with your credentials
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: Environment.Production
    });

    console.log("Getting Square API clients");
    
    // Get API clients
    const inventoryApi = squareClient.inventoryApi;
    const catalogApi = squareClient.catalogApi;
    const locationId = process.env.SQUARE_LOCATION_ID;

    console.log("Starting Square API calls");
    
    try {
      // Get catalog items (discs)
      console.log("Fetching catalog data");
      const catalogResponse = await catalogApi.listCatalog(
        undefined,
        "ITEM"
      );
      
      console.log("Fetching inventory data");
      // Get inventory counts for the location
      // Note: Using batchRetrieveInventoryCounts instead of retrieveInventoryCounts
      const inventoryResponse = await inventoryApi.batchRetrieveInventoryCounts({
        locationIds: [locationId]
      });
      
      console.log("Got responses from Square");
      console.log("Catalog items:", catalogResponse.result.objects ? catalogResponse.result.objects.length : 0);
      console.log("Inventory counts:", inventoryResponse.result.counts ? inventoryResponse.result.counts.length : 0);

      // If we have no catalog items, return dummy data for testing
      if (!catalogResponse.result.objects || catalogResponse.result.objects.length === 0) {
        console.log("No catalog items found, returning demo data");
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            inventory: getDemoData()
          }),
        };
      }

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
    } catch (apiError) {
      console.error('Square API
