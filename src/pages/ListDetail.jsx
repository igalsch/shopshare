import React, { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Plus, ShoppingCart, Package, Trash2, CheckCircle2, Share2, Calendar, Users, Loader2, Search, Minus, GripVertical } from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AppLayout from "@/components/layout/AppLayout"
import * as listService from "@/services/listService"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Product } from "@/entities/Product"
import { ShoppingItem } from "@/entities/ShoppingItem"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShareDialog } from "@/components/ShareDialog"

// Create a new SortableCategory component
const SortableCategory = ({ category, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div className="flex items-center gap-2 mb-2">
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-slate-800 rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </button>
        <h3 className="text-sm font-medium text-slate-400">{category}</h3>
      </div>
      <div className="grid gap-2 pl-7">
        {children}
      </div>
    </div>
  )
}

const ListDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [products, setProducts] = useState([])
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "",
    category: "",
    price: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("הכל")
  const [categoryList, setCategoryList] = useState([])
  const [newProduct, setNewProduct] = useState(null)
  const [categoryOrder, setCategoryOrder] = useState([])
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false)
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    category: ""
  })
  const [categoryInput, setCategoryInput] = useState("")
  const [openCategorySelect, setOpenCategorySelect] = useState(false)
  const [newProductBatch, setNewProductBatch] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load list data first
      const listData = await listService.getListById(id)
      if (!listData) {
        toast({
          title: "שגיאה בטעינת הרשימה",
          description: "הרשימה לא נמצאה",
          variant: "destructive",
        })
        navigate('/')
        return
      }
      setList(listData)

      // Load products with retry logic
      let productsData = []
      let retryCount = 0
      const maxRetries = 3

      while (retryCount < maxRetries) {
        try {
          productsData = await Product.getAll()
          if (productsData && productsData.length > 0) {
            break
          }
          retryCount++
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retrying
        } catch (error) {
          console.error('Error loading products (attempt ${retryCount + 1}):', error)
          retryCount++
          if (retryCount === maxRetries) {
            throw error
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      // Set products state
      setProducts(productsData)

      // Extract and set categories
      const uniqueCategories = [...new Set(productsData.map(p => p.category))]
      setCategoryList(uniqueCategories)

      // Load and enrich items with product data
      const itemsData = await ShoppingItem.getByListId(id)
      const enrichedItems = itemsData.map(item => {
        const product = productsData.find(p => p.id === item.product_id)
        return {
          ...item,
          product_id: item.product_id,
          product: product,
          isChecked: item.is_checked,
          quantity: item.quantity
        }
      })
      
      setItems(enrichedItems)

      // Update category order
      const categories = [...new Set(enrichedItems
        .filter(item => !item.isChecked)
        .map(item => {
          const product = productsData.find(p => p.id === item.product_id)
          return product?.category || 'ללא קטגוריה'
        })
      )]
      
      const savedOrder = localStorage.getItem(`categoryOrder_${id}`)
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder)
        const validSavedCategories = parsedOrder.filter(cat => categories.includes(cat))
        const newCategories = categories.filter(cat => !parsedOrder.includes(cat))
        setCategoryOrder([...validSavedCategories, ...newCategories])
      } else {
        setCategoryOrder(categories)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "שגיאה בטעינת הרשימה",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add a refresh function
  const refreshData = useCallback(async () => {
    await loadData()
  }, [id])

  // Add effect to refresh data when dialog closes
  useEffect(() => {
    if (!isDialogOpen && !newProductDialogOpen) {
      refreshData()
    }
  }, [isDialogOpen, newProductDialogOpen, refreshData])

  const handleAddItem = async (productId, quantity = 1, newlyCreatedProduct = null) => {
    const product = newlyCreatedProduct || products.find(p => p.id === productId)
    if (!product) return

    try {
      const newItem = await ShoppingItem.create({
        listId: id,
        productId,
        quantity
      })

      // Create the enriched item with the correct structure
      const enrichedItem = {
        ...newItem,
        product_id: productId,  // Ensure product_id is set correctly
        product: product,       // Include the full product object
        isChecked: false,      // Initialize as unchecked
        quantity: quantity     // Ensure quantity is set
      }
      
      setItems(prev => [...prev, enrichedItem])
      
      toast({
        title: "הפריט נוסף בהצלחה",
        description: `${product.name} נוסף לרשימה`,
      })
    } catch (error) {
      console.error('Error adding item:', error)
      toast({
        title: "שגיאה בהוספת פריט",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await handleRemoveItem(itemId)
      return
    }

    const item = items.find(i => i.id === itemId)
    if (!item) return

    try {
      const shoppingItem = new ShoppingItem(item)
      await shoppingItem.update({ quantity: newQuantity })
      
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      ))
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast({
        title: "שגיאה בעדכון כמות",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      const item = items.find(i => i.id === itemId)
      if (!item) return

      const shoppingItem = new ShoppingItem(item)
      await shoppingItem.delete()
      
      setItems(prev => prev.filter(i => i.id !== itemId))
      
      toast({
        title: "הפריט הוסר בהצלחה",
        description: "הפריט הוסר מהרשימה",
      })
    } catch (error) {
      console.error('Error removing item:', error)
      toast({
        title: "שגיאה בהסרת פריט",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesSearch = 
        searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = 
        selectedCategory === "הכל" || 
        product.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setCategoryOrder((items) => {
        const oldIndex = items.indexOf(active.id)
        const newIndex = items.indexOf(over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        // Save to localStorage
        localStorage.setItem(`categoryOrder_${id}`, JSON.stringify(newOrder))
        return newOrder
      })
    }
  }

  // Add this function to handle new product creation
  const handleCreateProduct = async (productData) => {
    try {
      const newProduct = await Product.create(productData)
      
      // Update products list, replacing existing product if it exists
      setProducts(prev => {
        const existingIndex = prev.findIndex(p => p.id === newProduct.id)
        if (existingIndex >= 0) {
          // Replace existing product
          const updated = [...prev]
          updated[existingIndex] = newProduct
          return updated
        }
        // Add new product
        return [...prev, newProduct]
      })
      
      // Update category list if needed
      if (productData.category && !categoryList.includes(productData.category)) {
        setCategoryList(prev => [...prev, productData.category])
      }

      // Find if this product is already in the list
      const existingItem = items.find(item => item.product_id === newProduct.id)
      
      if (!existingItem) {
        // Only add to list if not already present
        await handleAddItem(newProduct.id, 1, newProduct)
      }
      
      toast({
        title: existingItem ? "המוצר עודכן בהצלחה" : "המוצר נוצר בהצלחה",
        description: existingItem 
          ? `${newProduct.name} עודכן ברשימה`
          : `${newProduct.name} נוסף למוצרים ולרשימה`,
      })

      return newProduct
    } catch (error) {
      console.error('Error creating/updating product:', error)
      toast({
        title: "שגיאה בפעולת המוצר",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Add this function to handle batch product creation
  const handleCreateBatchProducts = async () => {
    const lines = newProductBatch.split('\n').filter(line => line.trim())
    const createdProducts = []

    for (const line of lines) {
      try {
        const [name, category = "", price = ""] = line.split(',').map(s => s.trim())
        if (!name) continue

        const productData = {
          name,
          category: category || "כללי",
          price: price ? parseFloat(price) : null
        }

        const newProduct = await handleCreateProduct(productData)
        createdProducts.push(newProduct)
      } catch (error) {
        console.error(`Error creating product from line: ${line}`, error)
      }
    }

    if (createdProducts.length > 0) {
      setNewProductBatch("")
      setNewProductDialogOpen(false)
    }
  }

  // Add this function to handle category selection
  const handleCategorySelect = (value) => {
    setNewProductForm(prev => ({ ...prev, category: value }))
    setCategoryInput(value)
    setOpenCategorySelect(false)
  }

  // Add this function to get filtered categories
  const getFilteredCategories = () => {
    const allCategories = [...new Set([...categoryList, categoryInput])].filter(Boolean)
    if (categoryInput) {
      return allCategories.filter(category => 
        category.toLowerCase().includes(categoryInput.toLowerCase())
      )
    }
    return allCategories
  }

  // Add this function to check if all items are collected
  const checkListCompletion = (updatedItems) => {
    const itemsToCheck = updatedItems || items;
    if (itemsToCheck.length === 0) return false;
    
    const allItemsCollected = itemsToCheck.every(item => item.isChecked);
    if (allItemsCollected && list.status === 'active') {
      setShowCompletionPrompt(true);
    } else {
      setShowCompletionPrompt(false);
    }
  };

  // Add this function to handle list completion
  const handleCompleteList = async () => {
    try {
      const updatedList = { ...list, status: 'completed' };
      await listService.updateList(updatedList);
      
      toast({
        title: "הרשימה הושלמה בהצלחה",
        description: "הרשימה עברה למצב 'הושלם'",
      });
      
      // Update local state
      setList(updatedList);
      setShowCompletionPrompt(false);
      
      // Navigate back to lists page
      navigate('/');
    } catch (error) {
      console.error('Error completing list:', error);
      toast({
        title: "שגיאה בהשלמת הרשימה",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Modify the existing toggleChecked handler to include completion check
  const handleToggleChecked = async (item) => {
    try {
      const shoppingItem = new ShoppingItem(item);
      await shoppingItem.toggleChecked();
      const updatedItems = items.map(i => 
        i.id === item.id ? { ...i, isChecked: !i.isChecked } : i
      );
      setItems(updatedItems);
      
      // Check if all items are now collected
      checkListCompletion(updatedItems);
    } catch (error) {
      console.error('Error toggling item:', error);
      toast({
        title: "שגיאה בעדכון פריט",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add useEffect to check completion status when items change
  useEffect(() => {
    checkListCompletion();
  }, [items]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      </AppLayout>
    )
  }

  if (!list) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-slate-100 mb-2">הרשימה לא נמצאה</h2>
          <p className="text-slate-400 mb-4">ייתכן שהרשימה נמחקה או שאין לך הרשאות גישה</p>
          <Button onClick={() => navigate('/')}>
            חזרה לרשימות
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
        {/* Header Section - Made responsive for mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">{list.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{items.length} פריטים</span>
              </div>
              {list.date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{list.date}</span>
                </div>
              )}
              {list.sharedWith?.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <div className="flex -space-x-2">
                    {list.sharedWith.map((user, index) => (
                      <Avatar key={index} className="h-6 w-6 border-2 border-slate-900">
                        <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
                          {user[0]}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
            <Button
              onClick={() => setIsShareDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white flex-1 sm:flex-none"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              שתף
            </Button>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 sm:flex-none"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              הוסף פריט
            </Button>
          </div>
        </div>

        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={setIsShareDialogOpen}
          listId={list.id}
        />

        {/* Completion Prompt - Make it more compact on mobile */}
        {showCompletionPrompt && (
          <Alert className="bg-emerald-900/20 border-emerald-800 mb-4">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <AlertTitle className="text-emerald-400">כל הפריטים נאספו!</AlertTitle>
            <AlertDescription className="text-emerald-300">
              האם תרצה לסמן את הרשימה כהושלמה?
            </AlertDescription>
            <div className="mt-3 sm:mt-4 flex gap-2 flex-wrap">
              <Button
                onClick={handleCompleteList}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                size="sm"
              >
                סמן כהושלם
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCompletionPrompt(false)}
                className="border-emerald-800 text-emerald-300 hover:text-emerald-200"
                size="sm"
              >
                המשך עריכה
              </Button>
            </div>
          </Alert>
        )}

        {/* Empty State - Adjusted for mobile */}
        {items.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <ShoppingCart className="h-10 sm:h-12 w-10 sm:w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-100 mb-2">הרשימה ריקה</h3>
              <p className="text-slate-400 text-center mb-4">
                לא נוספו עדיין פריטים לרשימה זו
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                הוסף פריט ראשון
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {/* Group and sort items */}
            {(() => {
              // Separate checked and unchecked items
              const uncheckedItems = items.filter(item => !item.isChecked)
              const checkedItems = items.filter(item => item.isChecked)

              // Group unchecked items by category
              const groupedUncheckedItems = uncheckedItems.reduce((groups, item) => {
                const category = item.product?.category || 'ללא קטגוריה'
                if (!groups[category]) {
                  groups[category] = []
                }
                groups[category].push(item)
                return groups
              }, {})

              // Use the ordered categories
              const categories = categoryOrder.filter(category => groupedUncheckedItems[category])

              return (
                <>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={categories}
                      strategy={verticalListSortingStrategy}
                    >
                      {categories.map(category => (
                        <SortableCategory key={category} category={category}>
                          {groupedUncheckedItems[category].map((item) => (
                            <Card key={item.id} className="bg-slate-900 border-slate-800">
                              <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`p-1 sm:p-2 text-slate-400 hover:text-slate-300 ${
                                    item.isChecked && "text-emerald-500 hover:text-emerald-400"
                                  }`}
                                  onClick={() => handleToggleChecked(item)}
                                >
                                  <CheckCircle2 className="h-5 w-5" />
                                </Button>

                                <div className="flex-1 min-w-0">
                                  <h3 className={`font-medium text-slate-100 mb-0 sm:mb-1 text-sm sm:text-base ${
                                    item.isChecked && "text-slate-400 line-through"
                                  }`}>
                                    {item.product?.name || 'מוצר לא ידוע'}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
                                    {item.product?.price && (
                                      <span>₪{item.product.price}</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <div className="flex items-center gap-1 bg-slate-800 rounded-md px-1 sm:px-2 py-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-slate-700 hover:text-slate-100"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-xs sm:text-sm font-medium w-6 sm:w-8 text-center text-slate-100">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-slate-700 hover:text-slate-100"
                                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 sm:p-2 text-slate-400 hover:text-red-400"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </SortableCategory>
                      ))}
                    </SortableContext>
                  </DndContext>

                  {/* Render checked items */}
                  {checkedItems.length > 0 && (
                    <div className="grid gap-2">
                      <h3 className="text-xs sm:text-sm font-medium text-slate-400 px-1">פריטים שנאספו</h3>
                      <div className="grid gap-2 opacity-60">
                        {checkedItems.map((item) => (
                          <Card key={item.id} className="bg-slate-900/50 border-slate-800">
                            <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 sm:p-2 text-emerald-500 hover:text-emerald-400"
                                onClick={() => handleToggleChecked(item)}
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </Button>

                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-slate-400 line-through mb-0 sm:mb-1 text-sm sm:text-base">
                                  {item.product?.name || 'מוצר לא ידוע'}
                                </h3>
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                                  <span>{item.quantity} יח׳</span>
                                  {item.product?.category && (
                                    <>
                                      <span>•</span>
                                      <span>{item.product.category}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 sm:p-2 text-slate-400 hover:text-red-400"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* New Product Dialog */}
        <Dialog open={newProductDialogOpen} onOpenChange={setNewProductDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[500px] w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-100">הוספת מוצר חדש</DialogTitle>
              <DialogDescription className="text-slate-400">
                הוסף מוצר חדש למאגר המוצרים ולרשימת הקניות
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="single" className="w-full">
              <TabsList className="w-full bg-slate-800">
                <TabsTrigger value="single" className="w-full text-slate-100 data-[state=active]:bg-slate-700">מוצר בודד</TabsTrigger>
                <TabsTrigger value="batch" className="w-full text-slate-100 data-[state=active]:bg-slate-700">הוספה מרובה</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="mt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">שם המוצר</Label>
                    <Input
                      id="name"
                      value={newProductForm.name}
                      onChange={e => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-slate-100"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>קטגוריה</Label>
                    <Popover open={openCategorySelect} onOpenChange={setOpenCategorySelect}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCategorySelect}
                          className="justify-between bg-slate-800 border-slate-700 text-right text-slate-100 hover:bg-slate-700 hover:text-slate-100"
                        >
                          {newProductForm.category || "בחר או הוסף קטגוריה"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-slate-800 border-slate-700">
                        <Command className="bg-slate-800">
                          <CommandInput
                            placeholder="חפש או הוסף קטגוריה"
                            value={categoryInput}
                            onValueChange={setCategoryInput}
                            className="h-9 text-slate-100 placeholder:text-slate-400"
                          />
                          <CommandEmpty className="text-slate-400">הקלד כדי להוסיף קטגוריה חדשה</CommandEmpty>
                          <CommandGroup className="text-slate-100">
                            {getFilteredCategories().map((category) => (
                              <CommandItem
                                key={category}
                                value={category}
                                onSelect={handleCategorySelect}
                                className="text-right cursor-pointer text-slate-100 hover:bg-slate-700 hover:text-slate-100 aria-selected:bg-slate-700"
                              >
                                {category}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    onClick={async () => {
                      if (!newProductForm.name) return
                      
                      try {
                        await handleCreateProduct({
                          name: newProductForm.name,
                          category: newProductForm.category || categoryInput || "כללי"
                        })
                        
                        setNewProductForm({
                          name: "",
                          category: ""
                        })
                        setCategoryInput("")
                        setNewProductDialogOpen(false)
                      } catch (error) {
                        // Error is handled in handleCreateProduct
                      }
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    צור מוצר
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="batch" className="mt-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>הכנס מוצרים</Label>
                    <DialogDescription className="text-sm text-slate-400">
                      הכנס שם מוצר וקטגוריה בכל שורה, מופרדים בפסיקים.
                      לדוגמה: חלב, מוצרי חלב
                    </DialogDescription>
                    <Textarea
                      value={newProductBatch}
                      onChange={e => setNewProductBatch(e.target.value)}
                      className="h-[200px] bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
                      placeholder="חלב, מוצרי חלב&#10;לחם, מאפים&#10;עגבניות, ירקות"
                      dir="rtl"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button
                    onClick={handleCreateBatchProducts}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    צור מוצרים
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Products Dialog - Optimize for mobile */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[800px] w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto p-4">
            <DialogHeader>
              <DialogTitle className="text-slate-100 text-lg">הוספת פריטים לרשימה</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col h-full overflow-hidden mt-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="חיפוש מוצרים..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-3 pr-10 bg-slate-800 border-slate-700 text-slate-100 text-sm"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[130px] bg-slate-800 border-slate-700 text-slate-100 text-sm h-9">
                      <SelectValue placeholder="קטגוריה" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="הכל">כל הקטגוריות</SelectItem>
                      {categoryList.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={() => {
                      setIsDialogOpen(false)
                      setNewProductDialogOpen(true)
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white ml-auto sm:ml-0 flex-1 sm:flex-none"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                    חדש
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                {getFilteredProducts().map(product => {
                  const isInList = items.some(item => item.product_id === product.id);
                  const listItem = items.find(item => item.product_id === product.id);
                  
                  return (
                    <div 
                      key={product.id}
                      className={`group relative bg-slate-800/50 rounded-lg border border-slate-700 p-2 sm:p-3
                        hover:bg-slate-800 transition-all hover:shadow-lg hover:border-slate-600
                        ${isInList ? "ring-2 ring-emerald-500/50" : ""}`}
                    >
                      {/* Product Name */}
                      <div className="text-xs sm:text-sm font-medium text-slate-100 mb-1 sm:mb-2 truncate" title={product.name}>
                        {product.name}
                      </div>

                      {/* Category Badge */}
                      <div className="mb-2">
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] sm:text-xs px-1.5 py-0 sm:px-2 sm:py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-100 truncate max-w-full"
                          title={product.category}
                        >
                          {product.category}
                        </Badge>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-auto">
                        {isInList ? (
                          <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-slate-600"
                              onClick={() => handleUpdateQuantity(listItem.id, listItem.quantity - 1)}
                            >
                              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="text-xs sm:text-sm font-medium w-6 sm:w-8 text-center text-slate-100">
                              {listItem.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-slate-600"
                              onClick={() => handleUpdateQuantity(listItem.id, listItem.quantity + 1)}
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddItem(product.id, 1)}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-7 text-xs"
                            size="sm"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            הוסף
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

export default ListDetail