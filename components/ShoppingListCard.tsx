import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingCart, Calendar, Edit, Trash2, CheckCircle2, Archive } from "lucide-react";
import { format } from "date-fns";

export default function ShoppingListCard({ list, onDelete, onCompleteList, onArchiveList }) {
  const statusColors = {
    "פעילה": "bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700",
    "הושלמה": "bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700",
    "ארכיון": "bg-slate-700 text-slate-200 hover:bg-slate-600 hover:text-white dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500"
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      return format(new Date(dateString), "EEEE, d/MM/yyyy");
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {list.title}
            </h3>
            <Badge className={statusColors[list.status]}>
              {list.status}
            </Badge>
          </div>
          
          {list.description && (
            <p className="text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
              {list.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-sm mb-3">
            {list.shopping_date && (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
                <span>{formatDate(list.shopping_date)}</span>
              </div>
            )}
            
            {list.is_default && (
              <Badge variant="outline" className="border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200">
                רשימה כללית
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-100 dark:border-gray-700 p-3 flex justify-between bg-gray-50 dark:bg-gray-800/50">
        <div className="flex gap-2">
          {list.status === "פעילה" && (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onCompleteList(list.id)}
                title="סמן כהושלם"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onArchiveList(list.id)}
                title="העבר לארכיון"
              >
                <Archive className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(list.id)}
            title="מחק רשימה"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            asChild
            variant="outline" 
            size="sm"
            className="bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <Link to={createPageUrl(`EditList?id=${list.id}`)}>
              <Edit className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
              ערוך
            </Link>
          </Button>
          <Button 
            asChild
            size="sm"
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Link to={createPageUrl(`ListDetail?id=${list.id}`)}>
              <ShoppingCart className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
              {list.status === "פעילה" ? "המשך קנייה" : "צפה"}
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}