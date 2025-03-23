import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUser() {
  const email = 'igalsch@gmail.com'
  
  try {
    // Check if user exists in auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserByEmail(email)
    
    if (authError) {
      console.error('Auth error:', authError)
      return
    }

    console.log('Auth user found:', {
      id: authData.user.id,
      email: authData.user.email,
      email_confirmed: authData.user.email_confirmed_at,
      created_at: authData.user.created_at
    })

    // Check if user exists in users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      return
    }

    console.log('User profile found:', profileData)
  } catch (error) {
    console.error('Error checking user:', error)
  }
}

checkUser() 