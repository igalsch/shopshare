import React from "react"
import { Calendar, ShoppingCart, Package, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AppLayout from "@/components/layout/AppLayout"

const History = () => {
  // Mock data for demonstration
  const mockHistory = [
    {
      id: 1,
      listName: "קניות שבועיות",
      date: "13/03/2025",
      items: 12,
      total: "₪156.80",
      status: "completed",
      sharedWith: ["יוחנן", "יעל"],
    },
    {
      id: 2,
      listName: "ציוד למסיבה",
      date: "12/03/2025",
      items: 8,
      total: "₪245.30",
      status: "completed",
      sharedWith: ["אלה"],
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h2 className="text-2xl font-bold mb-2">היסטוריית קניות</h2>
          <p className="text-slate-400">צפה בהיסטוריית הקניות שלך</p>
        </div>

        {/* Filters */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-slate-900 border-slate-800 w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">הכל</TabsTrigger>
              <TabsTrigger value="week" className="flex-1 sm:flex-none">השבוע האחרון</TabsTrigger>
              <TabsTrigger value="month" className="flex-1 sm:flex-none">החודש האחרון</TabsTrigger>
              <TabsTrigger value="year" className="flex-1 sm:flex-none">השנה האחרונה</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main Content */}
        {mockHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין היסטוריה</h3>
            <p className="text-slate-400 text-center mb-4">
              עדיין אין היסטוריית קניות
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockHistory.map((item) => (
              <Card key={item.id} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{item.listName}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {item.date}
                      </CardDescription>
                    </div>
                    <Badge variant={item.status === 'completed' ? 'default' : 'secondary'} className={item.status === 'completed' ? 'bg-emerald-500' : ''}>
                      {item.status === 'completed' ? 'הושלם' : 'בוטל'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-400">
                      <Package className="h-4 w-4 ml-2" />
                      <span>{item.items} פריטים</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                      <ShoppingCart className="h-4 w-4 ml-2" />
                      <span>סה"כ: {item.total}</span>
                    </div>
                    {item.sharedWith.length > 0 && (
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-400">משותף עם:</span>
                        <div className="flex -space-x-reverse -space-x-2">
                          {item.sharedWith.map((user, index) => (
                            <Avatar key={index} className="h-6 w-6 border-2 border-slate-900">
                              <AvatarFallback>{user[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" size="sm" className="border-slate-700">
                    צפה בפרטים
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default History 