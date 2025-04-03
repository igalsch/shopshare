import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, DollarSign, Store } from "lucide-react"
import { supabase } from "@/lib/supabase"
import AppLayout from "@/components/layout/AppLayout"

const Prices = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchPrices = async (query = "") => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('prices')
        .select(`
          *,
          stores (
            name,
            branch_name
          )
        `)
        .ilike('product_name', `%${query}%`)
        .order('price', { ascending: true })
        .limit(100) // Limit to 100 results for better performance

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching prices:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load prices when component mounts
  useEffect(() => {
    fetchPrices()
  }, [])

  const handleSearch = () => {
    fetchPrices(searchQuery)
  }

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-100">מחירים</h1>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-slate-100">חיפוש מחירים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="חיפוש מוצר..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                חיפוש
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center text-slate-400">טוען מחירים...</div>
        ) : products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((item) => (
              <Card key={item.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-slate-100">{item.product_name}</h3>
                      <p className="text-sm text-slate-400">{item.unit_of_measure}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-400">
                        ₪{item.price.toFixed(2)}
                      </p>
                      <p className="text-sm text-slate-400">
                        {item.stores.name} - {item.stores.branch_name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-400">לא נמצאו מחירים</div>
        )}
      </div>
    </AppLayout>
  )
}

export default Prices 