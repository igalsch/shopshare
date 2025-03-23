import { supabase } from '@/lib/supabase'
import { Product } from './Product'

export class ShoppingItem {
  constructor(data) {
    this.id = data.id
    this.list_id = data.list_id
    this.product_id = data.product_id
    this.quantity = data.quantity
    this.is_checked = data.is_checked ?? false
    this.created_at = data.created_at
    this.updated_at = data.updated_at
    this.product = data.product ? 
      (data.product instanceof Product ? data.product : new Product(data.product)) 
      : null
  }

  static async create({ listId, productId, quantity = 1 }) {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert([
          {
            list_id: listId,
            product_id: productId,
            quantity,
            is_checked: false
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
      console.error('Error creating shopping item:', error)
      throw error
    }
  }

  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return new ShoppingItem(data)
    } catch (error) {
      console.error('Error getting shopping item:', error)
      throw error
    }
  }

  static async getByListId(listId) {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('list_id', listId)

      if (error) throw error
      return data.map(item => new ShoppingItem(item))
    } catch (error) {
      console.error('Error fetching shopping items:', error)
      throw error
    }
  }

  async update({ quantity, isChecked }) {
    try {
      const updates = {}
      if (quantity !== undefined) updates.quantity = quantity
      if (isChecked !== undefined) updates.is_checked = isChecked

      const { data, error } = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', this.id)
        .select(`
          *,
          product:products(*)
        `)
        .single()

      if (error) throw error

      // Update local instance
      Object.assign(this, data)
      return this
    } catch (error) {
      console.error('Error updating shopping item:', error)
      throw error
    }
  }

  async delete() {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', this.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting shopping item:', error)
      throw error
    }
  }

  async toggleChecked() {
    return this.update({ isChecked: !this.is_checked })
  }

  async incrementQuantity() {
    return this.update({ quantity: this.quantity + 1 })
  }

  async decrementQuantity() {
    if (this.quantity > 1) {
      return this.update({ quantity: this.quantity - 1 })
    }
    return this.delete()
  }
} 