import React from "react"
import { Package, ShoppingCart, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ProductCard = ({ product, onEdit, onDelete, onAddToList }) => {
  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="group-hover:text-emerald-400 transition-colors">{product.name}</CardTitle>
            <CardDescription className="text-slate-400">{product.description}</CardDescription>
          </div>
          <Badge variant={product.inStock ? 'default' : 'secondary'} className={product.inStock ? 'bg-emerald-500' : ''}>
            {product.inStock ? 'במלאי' : 'אזל'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-slate-400">
            <Package className="h-4 w-4 ml-2" />
            <span>קטגוריה: {product.category}</span>
          </div>
          <div className="flex items-center text-sm text-slate-400">
            <span>מחיר: ₪{product.price}</span>
          </div>
          {product.notes && (
            <div className="text-sm text-slate-400">
              הערות: {product.notes}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-reverse space-x-2">
        <Button variant="outline" size="sm" className="border-slate-700" onClick={onEdit}>
          <Pencil className="h-4 w-4 ml-1" />
          ערוך
        </Button>
        <Button variant="outline" size="sm" className="border-slate-700 text-red-400 hover:text-red-300" onClick={onDelete}>
          <Trash2 className="h-4 w-4 ml-1" />
          מחק
        </Button>
        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={onAddToList}>
          <ShoppingCart className="h-4 w-4 ml-1" />
          הוסף לרשימה
        </Button>
      </CardFooter>
    </Card>
  )
}

export default ProductCard 