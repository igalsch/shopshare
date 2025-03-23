import { supabase } from '@/lib/supabase'

export class User {
  constructor(data) {
    this.id = data.id
    this.fullName = data.full_name
    this.displayName = data.display_name
    this.preferredTheme = data.preferred_theme
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  static async register(email, password, fullName) {
    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (authError) throw authError

      // Create the user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            full_name: fullName
          }
        ])

      if (profileError) throw profileError

      return new User({
        id: authData.user.id,
        full_name: fullName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error registering user:', error)
      throw error
    }
  }

  static async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Get the user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) throw profileError

      return new User(profile)
    } catch (error) {
      console.error('Error logging in:', error)
      throw error
    }
  }

  static async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) return null

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      return new User(profile)
    } catch (error) {
      console.error('Error getting current user:', error)
      throw error
    }
  }

  async updateProfile({ fullName, displayName, preferredTheme }) {
    try {
      const updates = {}
      if (fullName !== undefined) updates.full_name = fullName
      if (displayName !== undefined) updates.display_name = displayName
      if (preferredTheme !== undefined) updates.preferred_theme = preferredTheme

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.id)
        .select()
        .single()

      if (error) throw error

      // Update local instance
      Object.assign(this, data)
      return this
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  static async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }
} 