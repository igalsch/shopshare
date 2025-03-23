import React, { useState, useEffect } from "react"
import { Plus, Package, Search, Filter, Pencil, Trash2, ShoppingCart, Loader2, FileUp, LayoutGrid, List, Table2, Group, Calendar, Sparkles, Check, X, HelpCircle, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductCard from "@/components/ProductCard"
import AppLayout from "@/components/layout/AppLayout"
import { Product } from "@/entities/Product"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CategoryService } from "@/services/categoryService"
import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { BeakerIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ShareDialog } from '@/components/ShareDialog'
import { PendingInvitations } from '@/components/PendingInvitations'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    inStock: true,
    notes: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState(["all"])
  const [isBulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [bulkProducts, setBulkProducts] = useState("")
  const [importProgress, setImportProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)
  const [importSummary, setImportSummary] = useState(null)
  const [viewMode, setViewMode] = useState("grid")
  const [groupBy, setGroupBy] = useState("none")
  const [isSmartCategoriesDialogOpen, setIsSmartCategoriesDialogOpen] = useState(false)
  const [suggestedCategories, setSuggestedCategories] = useState([])
  const [processingSmartCategories, setProcessingSmartCategories] = useState(false)
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualCategories, setManualCategories] = useState([])
  const [isPending, startTransition] = useTransition()
  const [useAICategories, setUseAICategories] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  // Load products and categories when component mounts
  useEffect(() => {
    loadProducts()
    loadCategories()
    // Initialize the experimental AI feature flag
    CategoryService.setExperimentalAIEnabled(true) // You can change this based on your needs
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await Product.getAll()
      setProducts(data)
    } catch (error) {
      console.error("שגיאה בטעינת מוצרים:", error)
      toast({
        title: "שגיאה בטעינת מוצרים",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const categories = await Product.getCategories()
      setCategories(["all", ...categories])
    } catch (error) {
      console.error("שגיאה בטעינת קטגוריות:", error)
      toast({
        title: "שגיאה בטעינת קטגוריות",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const suggestCategory = async (productName, useAICategories) => {
    try {
      const suggestion = await CategoryService.suggestCategory(productName, products, useAICategories)
      return suggestion
    } catch (error) {
      console.error('Error suggesting category:', error)
      return 'ללא'
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name) {
      toast({
        title: "שגיאה",
        description: "יש למלא את שם המוצר",
        variant: "destructive",
      })
      return
    }

    try {
      // If no category is specified, get a suggestion only if AI is enabled
      if (!newProduct.category) {
        const suggestedCategory = await suggestCategory(newProduct.name, useAICategories)
        newProduct.category = suggestedCategory
      }

      const createdProduct = await Product.create({
        name: newProduct.name,
        category: newProduct.category || 'ללא',
      })
      
      setProducts(prev => [createdProduct, ...prev])
      setNewProduct({
        name: "",
        description: "",
        category: "",
        price: "",
        inStock: true,
        notes: "",
      })
      setIsDialogOpen(false)
      
      toast({
        title: "המוצר נוסף בהצלחה",
        description: `המוצר ${createdProduct.name} נוסף בהצלחה לקטגוריה ${createdProduct.category}`,
      })
    } catch (error) {
      console.error("שגיאה בהוספת מוצר:", error)
      
      if (error.message.includes("כבר קיים")) {
        toast({
          title: "המוצר כבר קיים",
          description: error.message,
          variant: "destructive",
        })
      } else {
      toast({
        title: "שגיאה בהוספת מוצר",
        description: error.message,
        variant: "destructive",
      })
      }
    }
  }

  const handleEditProduct = async (id) => {
    try {
      const product = await Product.getById(id)
      if (!product) {
        toast({
          title: "שגיאה",
          description: "המוצר לא נמצא",
          variant: "destructive",
        })
        return
      }
      setNewProduct(product)
      setIsDialogOpen(true)
    } catch (error) {
      console.error("שגיאה בטעינת מוצר:", error)
      toast({
        title: "שגיאה בטעינת מוצר",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSaveProduct = async () => {
    if (!newProduct.id) {
      await handleAddProduct()
      return
    }

    try {
      const updatedProduct = await Product.update(newProduct.id, newProduct)
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p))
      setNewProduct({
        name: "",
        description: "",
        category: "",
        price: "",
        inStock: true,
        notes: "",
      })
      setIsDialogOpen(false)
      
      toast({
        title: "המוצר עודכן בהצלחה",
        description: `המוצר ${updatedProduct.name} עודכן בהצלחה`,
      })
    } catch (error) {
      console.error("שגיאה בעדכון מוצר:", error)
      toast({
        title: "שגיאה בעדכון מוצר",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (id) => {
    try {
      const product = await Product.getById(id)
      if (!product) {
        toast({
          title: "שגיאה",
          description: "המוצר לא נמצא",
          variant: "destructive",
        })
        return
      }
      
      await product.delete()
      setProducts(prev => prev.filter(p => p.id !== id))
      
      toast({
        title: "המוצר נמחק בהצלחה",
        description: `המוצר ${product.name} נמחק בהצלחה`,
      })
    } catch (error) {
      console.error("שגיאה במחיקת מוצר:", error)
      toast({
        title: "שגיאה במחיקת מוצר",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleAddToList = (id) => {
    // TODO: Implement add to list functionality
    console.log("Add product to list:", id)
  }

  const getGroupedProducts = (products) => {
    if (groupBy === "none") return { "": products }
    
    return products.reduce((groups, product) => {
      let groupKey = ""
      
      switch (groupBy) {
        case "category":
          groupKey = product.category || "ללא קטגוריה"
          break
        case "month":
          groupKey = new Date(product.createdAt).toLocaleString('he-IL', { month: 'long', year: 'numeric' })
          break
        case "recent":
          const now = new Date()
          const created = new Date(product.createdAt)
          const daysDiff = Math.floor((now - created) / (1000 * 60 * 60 * 24))
          if (daysDiff === 0) groupKey = "היום"
          else if (daysDiff === 1) groupKey = "אתמול"
          else if (daysDiff < 7) groupKey = "השבוע"
          else if (daysDiff < 30) groupKey = "החודש"
          else groupKey = "ישן יותר"
          break
        default:
          groupKey = ""
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(product)
      return groups
    }, {})
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      searchQuery === "" || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleBulkImport = async () => {
    setIsImporting(true)
    setImportProgress(0)
    setImportSummary(null)

    try {
      const productLines = bulkProducts
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 50)

      const results = {
        total: productLines.length,
        successful: 0,
        failed: 0,
        categories: new Set(),
      }

      for (let i = 0; i < productLines.length; i++) {
        const name = productLines[i]
        try {
          // Get category suggestion only if AI is enabled
          const category = useAICategories ? 
            await suggestCategory(name, useAICategories) : 
            'ללא'

          const createdProduct = await Product.create({
            name,
            category,
          })
          
          results.successful++
          results.categories.add(category)
          
          setProducts(prev => [createdProduct, ...prev])
          setImportProgress(((i + 1) / productLines.length) * 100)
          
        } catch (error) {
          console.error(`Failed to import product: ${name}`, error)
          results.failed++
        }
      }

      if (results.categories.size > 0) {
        loadCategories()
      }

      setImportSummary({
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        categories: Array.from(results.categories),
      })

      if (results.failed === 0) {
        setBulkProducts("")
        setTimeout(() => {
          setBulkDialogOpen(false)
          setImportSummary(null)
        }, 3000)
      }

      toast({
        title: "ייבוא הושלם",
        description: `יובאו ${results.successful} מתוך ${results.total} מוצרים בהצלחה`,
        variant: results.failed > 0 ? "destructive" : "default",
      })

    } catch (error) {
      console.error("שגיאה בייבוא מוצרים:", error)
      toast({
        title: "שגיאה בייבוא מוצרים",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleSmartCategories = async () => {
    setProcessingSmartCategories(true);
    try {
        const uncategorizedProducts = products.filter(p => p.category === "ללא");

        if (uncategorizedProducts.length === 0) {
            setIsSmartCategoriesDialogOpen(true);
            setProcessingSmartCategories(false);
            return;
        }

        if (isManualMode) {
            // Prepare manual categories
            setManualCategories(uncategorizedProducts.map(product => ({
                productId: product.id,
                productName: product.name,
                currentCategory: product.category,
                newCategory: product.category,
                approved: true
            })));
            setSuggestedCategories([]);
        } else {
            // Prepare suggested categories
            setManualCategories([]);
            const suggestions = await Promise.all(
                uncategorizedProducts.map(async product => {
                    const suggestedCategory = await CategoryService.suggestCategory(
                        product.name,
                        products.filter(p => p.category && p.category !== "ללא")
                    );
                    return {
                        productId: product.id,
                        productName: product.name,
                        currentCategory: product.category,
                        suggestedCategory,
                        approved: true
                    };
                })
            );
            setSuggestedCategories(suggestions.filter(s => s.suggestedCategory !== s.currentCategory));
        }

        setIsSmartCategoriesDialogOpen(true);
    } catch (error) {
        console.error("Error suggesting categories:", error);
        toast({
            title: "שגיאה בהצעת קטגוריות",
            description: error.message,
            variant: "destructive",
        });
    } finally {
        setProcessingSmartCategories(false);
    }
  };

  const handleApplySmartCategories = async () => {
    setProcessingSmartCategories(true)
    try {
      let changes
      if (isManualMode) {
        changes = manualCategories.filter(c => c.approved && c.newCategory && c.newCategory !== c.currentCategory)
      } else {
        changes = suggestedCategories.filter(s => s.approved)
      }
      
      // Update each product
      await Promise.all(
        changes.map(async change => {
          const product = products.find(p => p.id === change.productId)
          if (product) {
            const updatedProduct = await Product.update(product.id, {
              ...product,
              category: isManualMode ? change.newCategory : change.suggestedCategory
            })
            // Update local state
            setProducts(prev => prev.map(p => 
              p.id === updatedProduct.id ? updatedProduct : p
            ))
          }
        })
      )
      
      toast({
        title: "הקטגוריות עודכנו בהצלחה",
        description: `${changes.length} מוצרים עודכנו`,
      })
      
      setIsSmartCategoriesDialogOpen(false)
      setSuggestedCategories([])
      setManualCategories([])
      
      // Refresh categories list
      loadCategories()
    } catch (error) {
      console.error("Error applying smart categories:", error)
      toast({
        title: "שגיאה בעדכון קטגוריות",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setProcessingSmartCategories(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Section - Make it stack on mobile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">מוצרים</h2>
            <p className="text-slate-400">נהל את קטלוג המוצרים שלך</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              onClick={handleSmartCategories}
              disabled={processingSmartCategories}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base flex-1 sm:flex-none"
              size="sm"
            >
              <Sparkles className="h-4 w-4 ml-1 sm:ml-2" />
              <span className="sm:inline">קטגוריות חכמות</span>
              <span className="inline sm:hidden">קטגוריות</span>
            </Button>
            <Button
              onClick={() => setIsShareDialogOpen(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base flex-1 sm:flex-none"
              size="sm"
            >
              <Share2 className="h-4 w-4 ml-1 sm:ml-2" />
              <span>שתף</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm sm:text-base flex-1 sm:flex-none"
                  size="sm"
                >
                  <Plus className="h-4 w-4 ml-1 sm:ml-2" />
                  <span>הוסף מוצר</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">
                    {newProduct.id ? "ערוך מוצר" : "הוסף מוצר חדש"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {newProduct.id 
                      ? "ערוך את פרטי המוצר הקיים"
                      : "הוסף מוצר חדש לקטלוג שלך"
                    }
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-slate-200">שם המוצר</Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setNewProduct(prev => ({ ...prev, name }))
                      }}
                      onBlur={async (e) => {
                        // Only suggest category if AI is enabled and no category is set
                        const name = e.target.value
                        if (name && !newProduct.category && useAICategories) {
                          const suggestion = await suggestCategory(name, useAICategories)
                          setNewProduct(prev => ({ ...prev, category: suggestion }))
                        }
                      }}
                      className="bg-slate-800 border-slate-700 text-slate-100"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="category" className="text-slate-200">קטגוריה</Label>
                      {!newProduct.id && CategoryService.isExperimentalAIEnabled && (
                        <div className="flex items-center gap-3">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700/50 transition-colors">
                                  <Switch
                                    id="useAI"
                                    checked={useAICategories}
                                    onCheckedChange={setUseAICategories}
                                    className="relative h-[24px] w-[44px] cursor-default rounded-full bg-slate-700 transition-colors data-[state=checked]:bg-yellow-500/20 border-2 border-slate-600 data-[state=checked]:border-yellow-500 [&>span]:translate-x-0 data-[state=checked]:[&>span]:translate-x-5"
                                  >
                                    <span className="block h-5 w-5 rounded-full bg-slate-300 shadow-lg ring-0 transition-transform data-[state=checked]:bg-yellow-500 transform -translate-y-1/2 top-1/2 absolute left-[2px]" />
                                  </Switch>
                                  <span className="text-xs flex items-center gap-1 text-slate-200">
                                    <BeakerIcon className="h-3.5 w-3.5 text-yellow-500" />
                                    קטגוריזציה חכמה
                                  </span>
                                  <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="bg-slate-900 border-slate-800">
                                <p className="text-xs text-slate-200">תכונה ניסיונית: הצעת קטגוריות אוטומטית באמצעות AI</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                    <Input
                      id="category"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-slate-100"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSaveProduct}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    {newProduct.id ? "שמור שינויים" : "צור מוצר"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isBulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 text-sm sm:text-base flex-1 sm:flex-none"
                  size="sm"
                >
                  <FileUp className="h-4 w-4 ml-1 sm:ml-2" />
                  <span>ייבוא</span>
                  <span className="hidden sm:inline"> מוצרים</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">ייבוא מוצרים</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    הוסף מספר מוצרים בבת אחת על ידי הכנסת שם מוצר בכל שורה
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    {CategoryService.isExperimentalAIEnabled && (
                      <div className="flex justify-end mb-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700/50 transition-colors">
                                <Switch
                                  id="useAIBulk"
                                  checked={useAICategories}
                                  onCheckedChange={setUseAICategories}
                                  className="relative h-[24px] w-[44px] cursor-default rounded-full bg-slate-700 transition-colors data-[state=checked]:bg-yellow-500/20 border-2 border-slate-600 data-[state=checked]:border-yellow-500 [&>span]:translate-x-0 data-[state=checked]:[&>span]:translate-x-5"
                                >
                                  <span className="block h-5 w-5 rounded-full bg-slate-300 shadow-lg ring-0 transition-transform data-[state=checked]:bg-yellow-500 transform -translate-y-1/2 top-1/2 absolute left-[2px]" />
                                </Switch>
                                <span className="text-xs flex items-center gap-1 text-slate-200">
                                  <BeakerIcon className="h-3.5 w-3.5 text-yellow-500" />
                                  קטגוריזציה חכמה
                                </span>
                                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-900 border-slate-800">
                              <p className="text-xs text-slate-200">תכונה ניסיונית: קטגוריזציה אוטומטית של מוצרים באמצעות AI</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                    <Label htmlFor="bulkProducts" className="text-slate-200">
                      רשימת מוצרים (מוצר אחד בכל שורה, עד 50 מוצרים)
                    </Label>
                    <Textarea
                      id="bulkProducts"
                      value={bulkProducts}
                      onChange={(e) => setBulkProducts(e.target.value)}
                      placeholder="לדוגמה:&#10;חלב&#10;לחם&#10;ביצים"
                      className="h-[200px] bg-slate-800 border-slate-700 text-slate-100"
                      dir="rtl"
                    />
                  </div>
                  {isImporting && (
                    <div className="space-y-2">
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-sm text-slate-400 text-center">מייבא מוצרים...</p>
                    </div>
                  )}
                  {importSummary && (
                    <div className="bg-slate-800 p-4 rounded-lg space-y-2">
                      <p className="text-sm text-slate-200">סיכום ייבוא:</p>
                      <ul className="text-sm text-slate-400 space-y-1">
                        <li>סה"כ מוצרים: {importSummary.total}</li>
                        <li>יובאו בהצלחה: {importSummary.successful}</li>
                        {importSummary.failed > 0 && (
                          <li className="text-red-400">נכשלו: {importSummary.failed}</li>
                        )}
                        <li>קטגוריות: {importSummary.categories.join(", ")}</li>
                      </ul>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleBulkImport}
                    disabled={isImporting || !bulkProducts.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        מייבא...
                      </>
                    ) : (
                      <>
                        <FileUp className="h-4 w-4 ml-2" />
                        ייבא מוצרים
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Pending Invitations */}
        <PendingInvitations />

        {/* Search, Filter, and View Options Section */}
        <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="חיפוש מוצרים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-slate-800 border-slate-700 text-slate-100"
            />
          </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 mt-1 sm:mt-0">
              <div className="bg-slate-800 border border-slate-700 rounded-md p-1 flex shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`px-3 ${viewMode === "grid" ? "bg-slate-700" : ""}`}
                  title="תצוגת רשת"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-3 ${viewMode === "list" ? "bg-slate-700" : ""}`}
                  title="תצוגת רשימה"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className={`px-3 ${viewMode === "table" ? "bg-slate-700" : ""}`}
                  title="תצוגת טבלה"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-md p-1 flex shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGroupBy("none")}
                  className={`px-3 ${groupBy === "none" ? "bg-slate-700" : ""}`}
                  title="ללא קיבוץ"
                >
                  <Package className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGroupBy("category")}
                  className={`px-3 ${groupBy === "category" ? "bg-slate-700" : ""}`}
                  title="קבץ לפי קטגוריה"
                >
                  <Group className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGroupBy("month")}
                  className={`px-3 ${groupBy === "month" ? "bg-slate-700" : ""}`}
                  title="קבץ לפי חודש"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-2 overflow-x-auto">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="w-full bg-slate-800 border border-slate-700 p-1 h-auto flex-wrap">
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="px-3 py-1.5 data-[state=active]:bg-slate-700"
                  >
                    {category === "all" ? "הכל" : category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
            <h3 className="text-lg font-semibold text-slate-100">טוען מוצרים...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-100 mb-2">אין מוצרים</h3>
            <p className="text-slate-400 text-center mb-4">
              {searchQuery || selectedCategory !== "all"
                ? "לא נמצאו מוצרים תואמים לחיפוש"
                : "הוסף מוצרים לקטלוג שלך"}
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              הוסף מוצר חדש
            </Button>
          </div>
        ) : (
          <>
            {Object.entries(getGroupedProducts(filteredProducts)).map(([group, products]) => (
              <div key={group} className="space-y-4 mb-8">
                {group && (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-slate-200">{group}</h3>
                    <Badge variant="secondary" className="bg-slate-700">
                      {products.length}
                    </Badge>
                  </div>
                )}

                {viewMode === "grid" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="group relative bg-slate-800/50 rounded-lg border border-slate-700 p-2 sm:p-3 hover:bg-slate-800 transition-all hover:shadow-lg hover:border-slate-600"
                      >
                        {/* Product Name */}
                        <div className="text-sm font-medium text-slate-100 mb-1 sm:mb-2 truncate" title={product.name}>
                          {product.name}
                        </div>

                        {/* Category Badge */}
                        <div className="mb-1 sm:mb-2">
                          <Badge 
                            variant="secondary" 
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-100 truncate max-w-full"
                            title={product.category}
                          >
                            {product.category}
                          </Badge>
                        </div>

                        {/* Action Buttons - Show on mobile without hover */}
                        <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 sm:transition-opacity flex items-center justify-center gap-2 rounded-lg">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditProduct(product.id)}
                            className="h-8 w-8 p-0 hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4 text-slate-100" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 text-slate-100 hover:text-red-400" />
                          </Button>
                        </div>
                        
                        {/* Touch-friendly actions for mobile */}
                        <div className="absolute top-1 left-1 sm:hidden flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProduct(product.id);
                            }}
                            className="h-6 w-6 p-0 bg-slate-700/70"
                          >
                            <Pencil className="h-3 w-3 text-slate-100" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(product.id);
                            }}
                            className="h-6 w-6 p-0 bg-slate-700/70"
                          >
                            <Trash2 className="h-3 w-3 text-slate-100" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === "list" && (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-800/50 rounded-lg border border-slate-700 p-3 sm:p-4 hover:bg-slate-800 transition-all hover:shadow-lg hover:border-slate-600"
                      >
                        <div className="flex items-start gap-2 flex-1">
                          <div>
                            <div className="font-medium text-slate-100">{product.name}</div>
                            <Badge 
                              variant="secondary" 
                              className="mt-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-100"
                            >
                              {product.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-auto">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditProduct(product.id)}
                            className="hover:bg-slate-700"
                          >
                            <Pencil className="h-4 w-4 text-slate-100" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 text-slate-100 hover:text-red-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {viewMode === "table" && (
                  <div className="rounded-lg border border-slate-700 overflow-x-auto">
                    <div className="min-w-[600px]">
                      <table className="w-full">
                        <thead className="bg-slate-800">
                          <tr>
                            <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">שם המוצר</th>
                            <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">קטגוריה</th>
                            <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">תאריך יצירה</th>
                            <th className="text-right text-slate-400 text-sm font-medium py-3 px-4">פעולות</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((product, index) => (
                            <tr 
                              key={product.id}
                              className={`border-t border-slate-700 hover:bg-slate-800/50 ${
                                index % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/50'
                              }`}
                            >
                              <td className="py-3 px-4 text-slate-100">{product.name}</td>
                              <td className="py-3 px-4">
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-100"
                                >
                                  {product.category}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {new Date(product.createdAt).toLocaleDateString('he-IL')}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditProduct(product.id)}
                                    className="hover:bg-slate-700"
                                  >
                                    <Pencil className="h-4 w-4 text-slate-100" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="hover:bg-red-500/10"
                                  >
                                    <Trash2 className="h-4 w-4 text-slate-100 hover:text-red-400" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        listId="products"
      />
    </AppLayout>
  )
}

export default Products