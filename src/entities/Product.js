import { supabase } from '@/lib/supabase'

export class Product {
  constructor(data) {
    this.id = data.id
    this.name = data.name
    this.category = data.category
    this.createdAt = data.created_at
    this.updatedAt = data.updated_at
  }

  static async create({ name, category }) {
    try {
      // First check if product with this name already exists
      const { data: existing } = await supabase
        .from('products')
        .select('*')
        .ilike('name', name)
        .single()

      if (existing) {
        throw new Error(`מוצר בשם "${name}" כבר קיים במערכת`)
      }

      // If product doesn't exist, create new one
      const { data, error } = await supabase
        .from('products')
        .insert([{ name, category }])
        .select()
        .single()

      if (error) throw error
      return new Product(data)
    } catch (error) {
      console.error('Error creating product:', error)
      throw error
    }
  }

  static async findByName(name) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', name)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }
      return data ? new Product(data) : null
    } catch (error) {
      console.error('Error finding product by name:', error)
      throw error
    }
  }

  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name')

      if (error) throw error
      return data.map(product => new Product(product))
    } catch (error) {
      console.error('Error getting products:', error)
      throw error
    }
  }

  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return new Product(data)
    } catch (error) {
      console.error('Error getting product:', error)
      throw error
    }
  }

  static async update(id, updates) {
    try {
      const product = await this.getById(id)
      if (!product) throw new Error('מוצר לא נמצא')
      return await product.update(updates)
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  static async search(query) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name')

      if (error) throw error
      return data.map(product => new Product(product))
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  }

  static async getByCategory(category) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .order('name')

      if (error) throw error
      return data.map(product => new Product(product))
    } catch (error) {
      console.error('Error getting products by category:', error)
      throw error
    }
  }

  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null)
        .order('category')

      if (error) throw error
      return [...new Set(data.map(item => item.category))]
    } catch (error) {
      console.error('Error getting categories:', error)
      throw error
    }
  }

  async update({ name, category }) {
    try {
      const updates = {}
      if (category !== undefined) updates.category = category
      if (name !== undefined) {
        // If name is being changed, check if the new name already exists
        if (name !== this.name) {
          const existing = await Product.findByName(name)
          if (existing && existing.id !== this.id) {
            throw new Error('מוצר בשם זה כבר קיים')
          }
        }
        updates.name = name
      }

      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', this.id)
        .select()
        .single()

      if (error) throw error

      // Update local instance
      Object.assign(this, data)
      return this
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  async delete() {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', this.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  static async findDuplicates() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name, count(*)')
        .group('name')
        .having('count(*) > 1')

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error finding duplicates:', error)
      throw error
    }
  }

  static async mergeDuplicates() {
    try {
      // Get all duplicates
      const duplicates = await this.findDuplicates()
      
      for (const dup of duplicates) {
        // Get all products with this name
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('name', dup.name)
          .order('created_at')

        if (!products || products.length <= 1) continue

        // Keep the first (oldest) product
        const keepProduct = products[0]
        const deleteIds = products.slice(1).map(p => p.id)

        // Update shopping items to point to the kept product
        await supabase
          .from('shopping_items')
          .update({ product_id: keepProduct.id })
          .in('product_id', deleteIds)

        // Delete the duplicate products
        await supabase
          .from('products')
          .delete()
          .in('id', deleteIds)
      }

      return true
    } catch (error) {
      console.error('Error merging duplicates:', error)
      throw error
    }
  }
} 