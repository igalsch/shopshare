import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { pipeline } from 'stream'
import { createGunzip } from 'zlib'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseString } from 'xml2js'
import { DOMParser } from '@xmldom/xmldom'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'
import { createReadStream, createWriteStream } from 'fs'
import { promisify } from 'util'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to scrape store information
async function fetchStoreInfo(storeId) {
  try {
    console.log(`Fetching store information for store ${storeId}...`);
    const response = await axios.get('http://141.226.203.152/');
    const html = response.data;
    
    console.log('Received HTML content:', html.substring(0, 500)); // Log the first 500 characters
    
    // Look for price files that match this store ID to extract the store name
    const priceFileRegex = new RegExp(`Price.*?7290058160839-${storeId}-\\d{12}\\.gz`, 'g');
    const priceFiles = html.match(priceFileRegex) || [];
    
    if (priceFiles.length > 0) {
      // Extract store name from the file listing section
      const storeSection = html.split(priceFiles[0])[0].split('\n').slice(-5).join('\n');
      console.log('Store section:', storeSection);
      
      // Look for store name in the section
      const storeNameMatch = storeSection.match(/Store\s+\d+\s*-\s*([^<\n]+)/);
      if (storeNameMatch && storeNameMatch[1]) {
        const location = storeNameMatch[1].trim();
        console.log(`Found store location: ${location}`);
        return {
          name: `נתיב החסד - ${location}`,
          location: location
        };
      }
    }
    
    throw new Error(`Could not find store information for store ${storeId}`);
  } catch (error) {
    console.error('Error fetching store information:', error);
    throw error;
  }
}

// Store configuration
const STORES = {
  '039': {
    name: 'נתיב החסד - נתניה',
    location: 'נתניה'
  },
  '042': {
    name: 'נתיב החסד - [LOCATION]', // Will be updated with scraped location
    location: '[LOCATION]' // Will be updated with scraped location
  }
}

const PRICE_FILES = [
  {
    id: '039',
    name: 'נתיב החסד - נתניה',
    url: 'http://141.226.203.152/prices/PriceFull7290058160839-039-202504030530.gz'
  }
]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function fetchPriceFiles(storeId) {
  try {
    console.log(`Fetching price files for store ${storeId}...`);
    const response = await axios.get('http://141.226.203.152/');
    const html = response.data;
    
    // Extract all files for the specific store
    const fileRegex = new RegExp(`Price(Full)?7290058160839-${storeId}-\\d{12}\\.gz`, 'g');
    const promoRegex = new RegExp(`Promo(Full)?7290058160839-${storeId}-\\d{12}\\.gz`, 'g');
    
    const priceFiles = html.match(fileRegex) || [];
    const promoFiles = html.match(promoRegex) || [];
    
    console.log(`Found ${priceFiles.length} price files and ${promoFiles.length} promo files for store ${storeId}`);
    
    return [...priceFiles, ...promoFiles];
  } catch (error) {
    console.error('Error fetching price files:', error);
    return [];
  }
}

async function fetchPriceFile(url) {
  try {
    console.log('Fetching price file from:', url);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data length:', response.data.length);
    
    // Save the raw response for examination
    const fileName = `price_data_${Date.now()}.raw`;
    await fs.writeFile(fileName, response.data);
    console.log('Saved raw response to', fileName);
    
    // Log the first 100 bytes in hex
    console.log('First 100 bytes (hex):', Buffer.from(response.data.slice(0, 100)).toString('hex'));
    
    return response.data;
  } catch (error) {
    console.error('Error fetching price file:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
}

async function decompressZipFile(data) {
  try {
    console.log('Data length:', data.length);
    
    // Check if it's a ZIP file (starts with PK)
    if (data[0] === 0x50 && data[1] === 0x4B) {
      console.log('Detected ZIP file format');
      
      // Create a new zip instance
      const zip = new AdmZip(data);
      
      // Get all entries
      const zipEntries = zip.getEntries();
      console.log('Found entries:', zipEntries.length);
      
      // Find the XML file
      const xmlEntry = zipEntries.find(entry => entry.entryName.endsWith('.xml'));
      if (!xmlEntry) {
        throw new Error('No XML file found in ZIP');
      }
      
      console.log('Found XML file:', xmlEntry.entryName);
      
      // Extract the XML content
      const xmlContent = zip.readAsText(xmlEntry);
      console.log('XML content length:', xmlContent.length);
      console.log('First 200 chars:', xmlContent.substring(0, 200));
      
      if (xmlContent.includes('<?xml') || xmlContent.includes('<Root>')) {
        console.log('Successfully extracted XML from ZIP');
        return xmlContent;
      }
    } else {
      console.log('Not a ZIP file, trying to read as raw text');
      const text = data.toString('utf-8');
      if (text.includes('<?xml') || text.includes('<Root>')) {
        console.log('Successfully read as raw text');
        return text;
      }
    }
    
    throw new Error('Could not extract valid XML from response');
  } catch (error) {
    console.error('Error in decompressZipFile:', error);
    throw error;
  }
}

async function parsePriceXML(xmlString) {
  try {
    console.log('XML string length:', xmlString.length);
    console.log('First 200 chars:', xmlString.substring(0, 200));
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const errors = xmlDoc.getElementsByTagName('parsererror');
    if (errors.length > 0) {
      throw new Error(`XML parsing error: ${errors[0].textContent}`);
    }
    
    const prices = [];
    const items = xmlDoc.getElementsByTagName('Item');
    
    console.log('Found items:', items.length);
    
    // Use a Map to handle duplicates (keep the latest version)
    const priceMap = new Map();
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const productCode = item.getElementsByTagName('ItemCode')[0]?.textContent || '';
      const price = {
        product_code: productCode,
        product_name: item.getElementsByTagName('ItemNm')[0]?.textContent || '',
        manufacturer: item.getElementsByTagName('ManufacturerName')[0]?.textContent || '',
        manufacturer_description: item.getElementsByTagName('ManufacturerItemDescription')[0]?.textContent || '',
        price: parseFloat(item.getElementsByTagName('ItemPrice')[0]?.textContent || '0'),
        unit_of_measure: item.getElementsByTagName('UnitQty')[0]?.textContent || '',
        update_date: item.getElementsByTagName('PriceUpdateDate')[0]?.textContent || new Date().toISOString()
      };
      
      // Only add if we have a valid product code and price
      if (productCode && price.price > 0) {
        priceMap.set(productCode, price);
      }
    }
    
    // Convert Map values to array
    const uniquePrices = Array.from(priceMap.values());
    console.log('Unique prices after deduplication:', uniquePrices.length);
    
    return uniquePrices;
  } catch (error) {
    console.error('Error parsing XML:', error);
    throw error;
  }
}

async function savePricesToDatabase(storeId, storeName, branchName, prices) {
  try {
    // First ensure the store exists
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .upsert({
        id: storeId,
        name: storeName,
        branch_name: branchName
      })
      .select()
      .single();

    if (storeError) {
      console.error('Error saving store:', storeError);
      throw storeError;
    }

    console.log('Store saved:', store);

    // Save prices in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < prices.length; i += batchSize) {
      const batch = prices.slice(i, i + batchSize);
      console.log(`Saving batch ${i / batchSize + 1} of ${Math.ceil(prices.length / batchSize)}`);
      
      // Process each price individually to handle conflicts
      for (const price of batch) {
        const { error: priceError } = await supabase
          .from('prices')
          .upsert({
            ...price,
            store_id: storeId
          }, {
            onConflict: 'product_code,store_id',
            ignoreDuplicates: false
          });

        if (priceError) {
          console.error('Error saving price:', priceError);
          // Continue with the next price instead of throwing
          continue;
        }
      }
    }

    console.log(`Successfully saved ${prices.length} prices for store ${storeId}`);
  } catch (error) {
    console.error('Error in savePricesToDatabase:', error);
    throw error;
  }
}

function isZIPFile(data) {
  // Check for ZIP file signature (PK\x03\x04)
  return data[0] === 0x50 && data[1] === 0x4B && data[2] === 0x03 && data[3] === 0x04;
}

async function extractXMLFromZIP(data) {
  try {
    const zip = new AdmZip(Buffer.from(data));
    const zipEntries = zip.getEntries();
    
    console.log('Found entries:', zipEntries.length);
    
    // Find the XML file
    const xmlEntry = zipEntries.find(entry => entry.entryName.endsWith('.xml'));
    if (!xmlEntry) {
      console.error('No XML file found in ZIP');
      return null;
    }
    
    console.log('Found XML file:', xmlEntry.entryName);
    const xmlContent = xmlEntry.getData().toString('utf8');
    console.log('XML content length:', xmlContent.length);
    
    return xmlContent;
  } catch (error) {
    console.error('Error extracting XML from ZIP:', error);
    return null;
  }
}

function deduplicatePrices(prices) {
  const uniquePrices = new Map();
  
  for (const price of prices) {
    const existingPrice = uniquePrices.get(price.product_code);
    if (!existingPrice || new Date(price.update_date) > new Date(existingPrice.update_date)) {
      uniquePrices.set(price.product_code, price);
    }
  }
  
  return Array.from(uniquePrices.values());
}

async function parsePromoXML(xmlString) {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    });
    
    const xmlObj = parser.parse(xmlString);
    const promotions = xmlObj.Root.Promotions.Promotion || [];
    
    // Cache price items
    let priceItems = [];
    try {
      const priceFile = await fetchPriceFile(`http://141.226.203.152/prices/PriceFull7290058160839-039-202504030530.gz`);
      const priceXml = await decompressZipFile(priceFile);
      priceItems = await parsePriceXML(priceXml);
      console.log('Cached price items:', priceItems.length);
    } catch (error) {
      console.error('Error fetching price items:', error);
    }
    
    const prices = [];
    for (const promo of Array.isArray(promotions) ? promotions : [promotions]) {
      const items = promo.PromotionItems?.Item || [];
      for (const item of Array.isArray(items) ? items : [items]) {
        const itemDetails = priceItems.find(p => p.product_code === item.ItemCode);
        
        const price = {
          product_code: item.ItemCode,
          product_name: itemDetails?.product_name || '',
          manufacturer: itemDetails?.manufacturer || '',
          manufacturer_description: itemDetails?.manufacturer_description || '',
          price: parseFloat(itemDetails?.price || '0'),
          unit_of_measure: itemDetails?.unit_of_measure || '',
          update_date: promo.PromotionUpdateDate || new Date().toISOString(),
          is_promo: true,
          promo_price: parseFloat(item.PromoPrice || '0'),
          promo_start_date: promo.PromotionStartDate,
          promo_end_date: promo.PromotionEndDate
        };
        
        // Only add if we have a valid product code and price
        if (price.product_code && (price.price > 0 || price.promo_price > 0)) {
          prices.push(price);
        }
      }
    }
    
    console.log('Found promo items:', prices.length);
    return prices;
  } catch (error) {
    console.error('Error parsing promo XML:', error);
    throw error;
  }
}

async function savePrices(prices, storeId) {
  try {
    // Upsert prices with conflict resolution on store_id and product_code
    const { data, error } = await supabase
      .from('prices')
      .upsert(
        prices.map(price => ({
          store_id: storeId,
          product_code: price.product_code,
          product_name: price.product_name,
          manufacturer: price.manufacturer,
          price: price.price,
          update_date: price.update_date
        })),
        {
          onConflict: 'store_id,product_code',
          ignoreDuplicates: false
        }
      )
      .select();

    if (error) throw error;
    
    console.log(`Successfully saved ${prices.length} prices for store ${storeId}`);
    return data;
  } catch (error) {
    console.error('Error saving prices:', error);
    throw error;
  }
}

async function saveStore(storeId, chainId) {
  try {
    const storeConfig = STORES[storeId];
    if (!storeConfig) {
      throw new Error(`Unknown store ID: ${storeId}`);
    }

    const { data, error } = await supabase
      .from('stores')
      .upsert({
        id: storeId,
        name: storeConfig.name,
        branch_name: storeConfig.name
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving store:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in saveStore:', error)
    throw error
  }
}

// Export the importPrices function
export async function importPrices() {
  try {
    console.log('Starting price import process...');
    
    // First, update store information for branch 042
    try {
      console.log('Fetching store information for branch 042...');
      const storeInfo = await fetchStoreInfo('042');
      STORES['042'] = {
        name: storeInfo.name,
        location: storeInfo.location
      };
      console.log('Updated store information for branch 042:', STORES['042']);
    } catch (error) {
      console.error('Failed to update store information for branch 042:', error);
    }

    const branches = Object.entries(STORES).map(([id, config]) => ({
      id,
      name: config.name
    }));

    console.log('Processing branches:', branches);

    for (const branch of branches) {
      console.log(`\nProcessing branch ${branch.id} (${branch.name})`);
      const files = await fetchPriceFiles(branch.id);
      
      if (files.length === 0) {
        console.error('No files found for branch', branch.id);
        continue;
      }

      console.log('Processing files:', files);

      for (const file of files) {
        try {
          console.log(`\nProcessing file: ${file}`);
          const fileUrl = `http://141.226.203.152/prices/${file}`;
          console.log('Fetching file from:', fileUrl);
          
          const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
          
          console.log(`Response status: ${response.status}`);
          console.log('Response headers:', response.headers);
          
          const data = response.data;
          console.log(`Response data length: ${data.length}`);
          
          // Save raw response for debugging
          const timestamp = Date.now();
          const rawFileName = path.join(__dirname, `price_data_${branch.id}_${timestamp}.raw`);
          await fs.writeFile(rawFileName, data);
          console.log(`Saved raw response to ${rawFileName}`);
          
          // Check first few bytes to determine file type
          const firstBytes = data.slice(0, 100);
          console.log('First 100 bytes (hex):', Buffer.from(firstBytes).toString('hex'));
          
          let xmlContent;
          if (isZIPFile(firstBytes)) {
            console.log('Detected ZIP file format');
            xmlContent = await extractXMLFromZIP(data);
          } else {
            console.log('Assuming raw XML format');
            xmlContent = data.toString('utf8');
          }
          
          if (!xmlContent) {
            console.error('Failed to extract XML content');
            continue;
          }
          
          console.log(`XML content length: ${xmlContent.length}`);
          console.log('First 200 chars:', xmlContent.substring(0, 200));
          
          let prices;
          if (file.includes('Promo')) {
            console.log('Processing promo file...');
            prices = await parsePromoXML(xmlContent);
          } else {
            console.log('Processing regular price file...');
            prices = await parsePriceXML(xmlContent);
          }
          
          console.log(`Found ${prices.length} items`);
          
          // Deduplicate prices based on product_code
          const uniquePrices = deduplicatePrices(prices);
          console.log(`Unique prices after deduplication: ${uniquePrices.length}`);
          
          // Save store information
          console.log('Saving store information...');
          const store = await saveStore(branch.id, 'default_chain_id');
          console.log('Store saved:', store);
          
          // Save prices in batches
          const batchSize = 1000;
          for (let i = 0; i < uniquePrices.length; i += batchSize) {
            const batch = uniquePrices.slice(i, i + batchSize);
            console.log(`Saving batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(uniquePrices.length / batchSize)}`);
            const savedPrices = await savePrices(batch, store.id);
            console.log(`Successfully saved ${savedPrices?.length || 0} prices in this batch`);
          }
          
          console.log(`Successfully processed file: ${file}`);
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
          continue;
        }
      }
    }
    
    console.log('Price import completed for all branches');
  } catch (error) {
    console.error('Error in import process:', error);
    throw error;
  }
}