import { supabase } from "@/lib/supabase"
import axios from "axios"
import pako from "pako"

const PRICE_SERVER_URL = "https://141.226.203.152"
const BRANCH_ID = "039"

export const priceService = {
  async fetchPriceFile() {
    try {
      const response = await axios.get(`${PRICE_SERVER_URL}/branch_${BRANCH_ID}.gz`, {
        responseType: 'arraybuffer'
      })
      
      // Decompress the gz file
      const decompressed = pako.ungzip(response.data, { to: 'string' })
      
      // Parse XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(decompressed, "text/xml")
      
      return this.parsePriceXML(xmlDoc)
    } catch (error) {
      console.error('Error fetching price file:', error)
      throw error
    }
  },

  parsePriceXML(xmlDoc) {
    const items = xmlDoc.getElementsByTagName('item')
    const prices = []

    for (let item of items) {
      const price = {
        product_code: item.getElementsByTagName('ItemCode')[0]?.textContent,
        product_name: item.getElementsByTagName('ItemName')[0]?.textContent,
        price: parseFloat(item.getElementsByTagName('ItemPrice')[0]?.textContent),
        unit_of_measure: item.getElementsByTagName('UnitOfMeasure')[0]?.textContent,
        update_date: new Date().toISOString(),
        store_id: BRANCH_ID
      }
      prices.push(price)
    }

    return prices
  },

  async savePricesToDatabase(prices) {
    try {
      // First, ensure the store exists
      const { error: storeError } = await supabase
        .from('stores')
        .upsert({
          id: BRANCH_ID,
          name: 'שופרסל',
          branch_name: 'נתניה - סניף 039'
        })

      if (storeError) throw storeError

      // Then, save the prices
      const { error: priceError } = await supabase
        .from('prices')
        .upsert(prices, {
          onConflict: 'product_code,store_id'
        })

      if (priceError) throw priceError

      return true
    } catch (error) {
      console.error('Error saving prices to database:', error)
      throw error
    }
  },

  async updatePrices() {
    try {
      const prices = await this.fetchPriceFile()
      await this.savePricesToDatabase(prices)
      return true
    } catch (error) {
      console.error('Error updating prices:', error)
      throw error
    }
  }
} 