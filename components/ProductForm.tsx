import React, { useState, useEffect } from "react";
import { Product } from "@/entities/Product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Heart, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProductForm({ product, onSave, onCancel, isDialog = false }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "אחר",
    notes: "",
    last_price: "",
    image_url: "",
    is_favorite: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        category: product.category || "אחר",
        notes: product.notes || "",
        last_price: product.last_price ? product.last_price.toString() : "",
        image_url: product.image_url || "",
        is_favorite: product.is_favorite || false
      });
    }
  }, [product]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // טיפול במספרים
    const processedData = {
      ...formData,
      last_price: formData.last_price ? parseFloat(formData.last_price) : undefined
    };

    try {
      // הסרת שדות לא חוקיים
      const cleanData = Object.entries(processedData)
        .filter(([_, value]) => value !== "")
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

      let savedProduct;
      if (product?.id) {
        savedProduct = await Product.update(product.id, cleanData);
      } else {
        savedProduct = await Product.create(cleanData);
      }
      
      onSave(savedProduct);
    } catch (error) {
      console.error("שגיאה בשמירת המוצר:", error);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    "ירקות ופירות", 
    "מוצרי חלב", 
    "בשר ודגים", 
    "מאפים", 
    "שימורים", 
    "משקאות", 
    "ממתקים וחטיפים", 
    "מוצרי ניקיון", 
    "אחר"
  ];

  return (
    <Card className={cn(!isDialog && "max-w-md mx-auto")}>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {product?.id ? "עריכת מוצר" : "מוצר חדש"}
          </CardTitle>
          {isDialog && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם המוצר</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="שם המוצר"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">קטגוריה</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_price">מחיר אחרון (אופציונלי)</Label>
            <Input
              id="last_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.last_price}
              onChange={(e) => handleChange("last_price", e.target.value)}
              placeholder="לדוגמה: 9.90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">קישור לתמונה (אופציונלי)</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">הערות (אופציונלי)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="פרטים נוספים על המוצר"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Switch
              id="is_favorite"
              checked={formData.is_favorite}
              onCheckedChange={(value) => handleChange("is_favorite", value)}
            />
            <Label htmlFor="is_favorite" className="flex items-center space-x-2 rtl:space-x-reverse">
              <Heart className={cn(
                "h-4 w-4",
                formData.is_favorite ? "fill-red-500 text-red-500" : "text-gray-500"
              )} />
              <span>סמן כמועדף</span>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          {!isDialog && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              ביטול
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />
                שומר...
              </>
            ) : (
              product?.id ? "עדכן" : "הוסף מוצר"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}