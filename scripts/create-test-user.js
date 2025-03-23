import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUser() {
  const email = 'test5.shopshare@gmail.com'
  const password = 'Test123!'

  try {
    // First create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    })

    if (authError) throw authError

    console.log('Auth user created:', authData)

    // Wait a moment to ensure the auth user is fully created
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Then create the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          full_name: 'Test User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()

    if (profileError) {
      console.error('Profile error:', profileError)
      throw profileError
    }

    console.log('User profile created:', profileData)
    console.log('\nYou can now log in with these credentials:')
    console.log('Email:', email)
    console.log('Password:', password)
  } catch (error) {
    console.error('Error creating user:', error)
  }
}

createUser() 