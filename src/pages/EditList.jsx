import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowRight, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AppLayout from "@/components/layout/AppLayout"
import * as listService from "@/services/listService"
import { toast } from "@/components/ui/use-toast"

const EditList = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [listData, setListData] = useState({
    name: "",
    description: "",
    date: "",
    status: "active",
    sharedWith: [],
  })

  // Fetch list data when component mounts
  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true)
      try {
        const list = await listService.getListById(id)
        if (list) {
          setListData({
            id: list.id,
            name: list.name || "",
            description: list.description || "",
            date: new Date(list.created_at).toISOString().split('T')[0],
            status: list.status || "active",
            sharedWith: list.sharedWith || [],
          })
        } else {
          toast({
            title: "שגיאה בטעינת הרשימה",
            description: "לא נמצאה רשימה עם המזהה המבוקש",
            variant: "destructive",
          })
          navigate('/')
        }
      } catch (error) {
        console.error('Error fetching list:', error)
        toast({
          title: "שגיאה בטעינת הרשימה",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchList()
    }
  }, [id, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const updatedList = {
        id: id,
        name: listData.name,
        description: listData.description,
        status: listData.status,
      }

      const result = await listService.updateList(updatedList)
      
      if (result._not_synced) {
        throw new Error(result._error || 'Failed to update list')
      }

      toast({
        title: "הרשימה עודכנה בהצלחה",
        description: "השינויים נשמרו בהצלחה",
      })
      
      navigate('/')
    } catch (error) {
      console.error('Error updating list:', error)
      toast({
        title: "שגיאה בעדכון הרשימה",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = (newStatus) => {
    setListData(prev => ({ ...prev, status: newStatus }))
  }

  const getStatusBadgeStyle = (badgeStatus) => {
    const isSelected = listData.status === badgeStatus
    return isSelected
      ? "bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
      : "bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white border-slate-600 cursor-pointer"
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h2 className="text-2xl font-bold mb-2 text-slate-100">ערוך רשימה</h2>
          <p className="text-slate-300">ערוך את פרטי רשימת הקניות</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">פרטי רשימה</CardTitle>
              <CardDescription className="text-slate-300">ערוך את פרטי רשימת הקניות</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-slate-200">שם הרשימה</Label>
                <Input
                  id="name"
                  value={listData.name}
                  onChange={(e) => setListData({ ...listData, name: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-slate-200">תיאור</Label>
                <Input
                  id="description"
                  value={listData.description}
                  onChange={(e) => setListData({ ...listData, description: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date" className="text-slate-200">תאריך יצירה</Label>
                <Input
                  id="date"
                  type="date"
                  value={listData.date}
                  disabled={true}
                  className="bg-slate-800 border-slate-700 text-slate-100 opacity-50 cursor-not-allowed"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-slate-200">סטטוס</Label>
                <div className="flex space-x-reverse space-x-2">
                  <Badge
                    variant={listData.status === "active" ? "default" : "secondary"}
                    className={getStatusBadgeStyle("active")}
                    onClick={() => handleStatusChange("active")}
                  >
                    פעיל
                  </Badge>
                  <Badge
                    variant={listData.status === "completed" ? "default" : "secondary"}
                    className={getStatusBadgeStyle("completed")}
                    onClick={() => handleStatusChange("completed")}
                  >
                    הושלם
                  </Badge>
                  <Badge
                    variant={listData.status === "archived" ? "default" : "secondary"}
                    className={getStatusBadgeStyle("archived")}
                    onClick={() => handleStatusChange("archived")}
                  >
                    בארכיון
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-100">שיתוף</CardTitle>
              <CardDescription className="text-slate-300">נהל את משתמשים משותפים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-4 w-4 text-slate-300" />
                <span className="text-sm text-slate-300">משותף עם:</span>
                <div className="flex -space-x-reverse -space-x-2">
                  {listData.sharedWith.map((user, index) => (
                    <Avatar key={index} className="h-6 w-6 border-2 border-slate-900">
                      <AvatarFallback className="bg-slate-700 text-slate-200">{user[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mr-2 bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white">
                  הוסף משתמש
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-reverse space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="mr-2">שומר...</span>
                </>
              ) : (
                <>
                  שמור שינויים
                  <ArrowRight className="h-4 w-4 mr-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default EditList 