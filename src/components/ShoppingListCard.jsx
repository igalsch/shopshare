import React from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Calendar, Users, Package, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const ShoppingListCard = ({ list, onDelete, onDuplicate }) => {
  const navigate = useNavigate()

  const handleEditList = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    navigate(`/edit-list/${list.id}`)
  }

  const handleContinueShopping = (e) => {
    // Only navigate if the click wasn't on a button
    if (!e.target.closest('button')) {
      navigate(`/list-detail/${list.id}`)
    }
  }

  const handleDelete = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    onDelete(list.id)
  }

  const handleDuplicate = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    onDuplicate(list)
  }

  const getStatusBadgeStyle = () => {
    switch (list.status) {
      case 'active':
        return 'bg-emerald-500 text-white'
      case 'completed':
        return 'bg-slate-700 text-slate-200'
      case 'archived':
        return 'bg-slate-700 text-slate-200'
      default:
        return 'bg-slate-700 text-slate-200'
    }
  }

  const getStatusText = () => {
    switch (list.status) {
      case 'active':
        return 'פעיל'
      case 'completed':
        return 'הושלם'
      case 'archived':
        return 'בארכיון'
      default:
        return 'פעיל'
    }
  }

  return (
    <Card 
      className="group relative bg-slate-900 border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
      onClick={handleContinueShopping}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-slate-100">{list.name}</CardTitle>
            <CardDescription className="text-slate-400">{list.description}</CardDescription>
          </div>
          <Badge className={getStatusBadgeStyle()}>{getStatusText()}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>{list.items} פריטים</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{list.date}</span>
          </div>
        </div>

        {list.sharedWith?.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
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
      </CardContent>

      <CardFooter className="flex items-center p-6 pt-0 border-t border-slate-800 bg-slate-900/50">
        <div className="flex w-full gap-[10%] justify-center">
          <Button
            variant="ghost"
            size="default"
            className="flex-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 z-10"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="default"
            className="flex-1 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 z-10"
            onClick={handleDuplicate}
          >
            <Copy className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="default"
            className="flex-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700 z-10"
            onClick={handleEditList}
          >
            <Pencil className="h-5 w-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ShoppingListCard 