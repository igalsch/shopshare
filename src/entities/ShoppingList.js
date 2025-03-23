import { supabase } from '@/lib/supabase'
import { ShoppingItem } from './ShoppingItem'

export class ShoppingList {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.userId = data.user_id
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  static async create({ name }) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('shopping_lists')
        .insert([
          {
            name,
            user_id: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error
      return new ShoppingList(data)
    } catch (error) {
      console.error('Error creating shopping list:', error)
      throw error
    }
  }

  static async getAll() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data.map(list => new ShoppingList(list))
    } catch (error) {
      console.error('Error getting shopping lists:', error)
      throw error
    }
  }

  static async getById(id) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      return new ShoppingList(data)
    } catch (error) {
      console.error('Error getting shopping list:', error)
      throw error
    }
  }

  async getItems() {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('list_id', this.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data.map(item => new ShoppingItem(item))
    } catch (error) {
      console.error('Error getting shopping items:', error)
      throw error
    }
  }

  async addItem(productId, quantity = 1) {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert([
          {
            list_id: this.id,
            product_id: productId,
            quantity
          }
        ])
        .select(`
          *,
          product:products(*)
        `)
        .single()

      if (error) throw error
      return new ShoppingItem(data)
    } catch (error) {
      console.error('Error adding item to list:', error)
      throw error
    }
  }

  async update({ name }) {
    try {
      const updates = {}
      if (name !== undefined) updates.name = name

      const { data, error } = await supabase
        .from('shopping_lists')
        .update(updates)
        .eq('id', this.id)
        .select()
        .single()

      if (error) throw error

      // Update local instance
      Object.assign(this, data)
      return this
    } catch (error) {
      console.error('Error updating shopping list:', error)
      throw error
    }
  }

  async delete() {
    try {
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', this.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting shopping list:', error)
      throw error
    }
  }
} 