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
      // Get all catalog items with pagination
      console.log("Fetching catalog data with pagination");
      
      let allCatalogItems = [];
      let cursor = null;
      let hasMore = true;
      
      // Fetch all catalog items with pagination
      while (hasMore) {
        const catalogResponse = await catalogApi.listCatalog(
          cursor,
          "ITEM"
        );
        
        if (catalogResponse.result.objects) {
          allCatalogItems = allCatalogItems.concat(catalogResponse.result.objects);
        }
        
        cursor = catalogResponse.result.cursor;
        hasMore = !!cursor;
      }
      
      console.log(`Fetched ${allCatalogItems.length} total catalog items`);
      
      // Get all inventory counts with pagination
      console.log("Fetching inventory data with pagination");
      let allInventoryCounts = [];
      cursor = null;
      hasMore = true;
      
      // Fetch inventory counts for the location
      while (hasMore) {
        const inventoryResponse = await inventoryApi.batchRetrieveInventoryCounts({
          locationIds: [locationId],
          cursor: cursor
        });
        
        if (inventoryResponse.result.counts) {
          allInventoryCounts = allInventoryCounts.concat(inventoryResponse.result.counts);
        }
        
        cursor = inventoryResponse.result.cursor;
        hasMore = !!cursor;
      }
      
      console.log(`Fetched ${allInventoryCounts.length} inventory count records`);

      // Process the responses to create a combined inventory view
      const processedInventory = processCatalogAndInventory(
        allCatalogItems,
        allInventoryCounts
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          inventory: processedInventory,
          totalItems: processedInventory.length
        }),
      };
    } catch (apiError) {
      console.error('Square API error:', apiError);
      
      // Return error message but with status 200 to prevent frontend crashes
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: apiError.message,
          inventory: [] // Empty array rather than null
        }),
      };
    }
  } catch (error) {
    console.error('Error in function:', error);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message,
        inventory: [] // Empty array rather than null
      }),
    };
  }
};

// Process catalog and inventory data to create a combined view
function processCatalogAndInventory(catalogItems, inventoryCounts) {
  try {
    // Extract items and their variations from catalog
    const discs = [];
    
    // First, organize inventory counts by catalog object ID for easy lookup
    const inventoryMap = {};
    inventoryCounts.forEach(count => {
      if (count.state === 'IN_STOCK') {
        // Convert BigInt to normal number if needed
        let quantity = count.quantity;
        if (typeof quantity === 'bigint') {
          quantity = Number(quantity.toString());
        }
        inventoryMap[count.catalogObjectId] = quantity;
      }
    });
    
    // Common vendors and plastics for inferring information
    const knownVendors = [
      "Innova", "Discraft", "Dynamic Discs", "MVP", "Axiom", "Streamline", 
      "Latitude 64", "Westside", "Prodigy", "Gateway", "Kastaplast", "Discmania"
    ];
    
    const knownPlastics = [
      "Star", "Champion", "DX", "Blizzard", "GStar", "Pro", "XT", "KC Pro", "Halo",
      "ESP", "Z", "CryZtal", "Titanium", "Jawbreaker", "FLX", "Elite X",
      "Neutron", "Plasma", "Proton", "Eclipse", "Electron", "Cosmic",
      "Gold", "Opto", "VIP", "Tournament", "Fuzion", "Lucid", "BioFuzion"
    ];
    
    // Process catalog items (discs)
    catalogItems.forEach(item => {
      // Only process items, not categories or other catalog objects
      if (item.type !== 'ITEM' || !item.itemData) {
        return;
      }
      
      // Parse item name to extract info
      const itemName = item.itemData.name || '';
      
      // Determine vendor from name or category
      let vendor = "Unknown";
      for (const knownVendor of knownVendors) {
        if (itemName.includes(knownVendor)) {
          vendor = knownVendor;
          break;
        }
      }
      
      // Item name is likely to be the mold
      let mold = itemName;
      
      if (item.itemData.variations) {
        // Process each variation
        item.itemData.variations.forEach(variation => {
          if (!variation.itemVariationData) return;
          
          const variationName = variation.itemVariationData.name || '';
          const fullName = variationName ? `${itemName} ${variationName}` : itemName;
          
          // Determine plastic type
          let plastic = "Unknown";
          for (const knownPlastic of knownPlastics) {
            if (fullName.includes(knownPlastic)) {
              plastic = knownPlastic;
              break;
            }
          }
          
          // If we didn't find a plastic, it's likely just called "Regular"
          if (plastic === "Unknown" && variationName) {
            plastic = variationName;
          }
          
          // Get current stock
          const stock = inventoryMap[variation.id] ? parseInt(inventoryMap[variation.id]) : 0;
          
          // Get price (handle BigInt if needed)
          let price = 0;
          if (variation.itemVariationData.priceMoney) {
            let amount = variation.itemVariationData.priceMoney.amount;
            if (typeof amount === 'bigint') {
              amount = Number(amount.toString());
            }
            price = amount / 100;
          }
          
          // Create disc entry
          discs.push({
            id: variation.id,
            name: fullName,
            sku: variation.itemVariationData.sku || '',
            stock: stock,
            price: price,
            vendor: vendor,
            plastic: plastic,
            mold: mold,
            // We don't have actual sales data, but these fields are expected by your frontend
            sales30: 0,
            sales90: 0,
            variationName: variationName,
            itemId: item.id
          });
        });
      }
    });
    
    return discs;
  } catch (processError) {
    console.error('Error processing catalog and inventory:', processError);
    return []; // Return empty array on error
  }
}
