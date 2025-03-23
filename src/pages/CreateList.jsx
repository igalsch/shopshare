import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AppLayout from "@/components/layout/AppLayout"

const CreateList = () => {
  const navigate = useNavigate()
  const [listData, setListData] = useState({
    name: "",
    description: "",
    date: "",
    status: "active",
    sharedWith: [],
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement API call to create list
    navigate("/lists")
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <h2 className="text-2xl font-bold mb-2">צור רשימה חדשה</h2>
          <p className="text-slate-400">צור רשימת קניות חדשה</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>פרטי רשימה</CardTitle>
              <CardDescription>הזן את פרטי רשימת הקניות החדשה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">שם הרשימה</Label>
                <Input
                  id="name"
                  value={listData.name}
                  onChange={(e) => setListData({ ...listData, name: e.target.value })}
                  placeholder="הזן שם לרשימה"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">תיאור</Label>
                <Input
                  id="description"
                  value={listData.description}
                  onChange={(e) => setListData({ ...listData, description: e.target.value })}
                  placeholder="תאר את רשימת הקניות"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">תאריך</Label>
                <Input
                  id="date"
                  type="date"
                  value={listData.date}
                  onChange={(e) => setListData({ ...listData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>סטטוס</Label>
                <div className="flex space-x-reverse space-x-2">
                  <Badge
                    variant={listData.status === "active" ? "default" : "secondary"}
                    className={listData.status === "active" ? "bg-emerald-500" : ""}
                  >
                    פעיל
                  </Badge>
                  <Badge
                    variant={listData.status === "completed" ? "default" : "secondary"}
                    className={listData.status === "completed" ? "bg-emerald-500" : ""}
                  >
                    הושלם
                  </Badge>
                  <Badge
                    variant={listData.status === "archived" ? "default" : "secondary"}
                    className={listData.status === "archived" ? "bg-emerald-500" : ""}
                  >
                    בארכיון
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>שיתוף</CardTitle>
              <CardDescription>הוסף משתמשים משותפים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-400">משותף עם:</span>
                <div className="flex -space-x-reverse -space-x-2">
                  {listData.sharedWith.map((user, index) => (
                    <Avatar key={index} className="h-6 w-6 border-2 border-slate-900">
                      <AvatarFallback>{user[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mr-2">
                  הוסף משתמש
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-reverse space-x-4">
            <Button variant="outline" onClick={() => navigate("/lists")}>
              ביטול
            </Button>
            <Button type="submit">
              צור רשימה
              <ArrowRight className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}

export default CreateList 