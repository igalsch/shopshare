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
import cron from 'node-cron'
import { importPrices } from './importPrices.js'

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Schedule price updates
// 8:00 Israel time (UTC+2/UTC+3 depending on DST)
cron.schedule('0 6 * * *', async () => {
  console.log('Running morning price update at 8:00 Israel time...')
  try {
    await importPrices()
    console.log('Morning price update completed successfully')
  } catch (error) {
    console.error('Error during morning price update:', error)
  }
})

// 13:00 Israel time (UTC+2/UTC+3 depending on DST)
cron.schedule('0 11 * * *', async () => {
  console.log('Running afternoon price update at 13:00 Israel time...')
  try {
    await importPrices()
    console.log('Afternoon price update completed successfully')
  } catch (error) {
    console.error('Error during afternoon price update:', error)
  }
})

// Keep the script running
console.log('Price update scheduler started. Updates will run at 8:00 and 13:00 Israel time.')
process.stdin.resume() 