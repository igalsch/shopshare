import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus, Check, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProductCard({ 
  product, 
  view = "grid", 
  onAddToList, 
  onRemoveFromList, 
  onTogglePurchased,
  onToggleFavorite,
  inList = false,
  isPurchased = false,
  quantity = 0 
}) {
  if (!product) return null;
  
  if (view === "list") {
    return (
      <div className={cn(
        "p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-all",
        inList && isPurchased && "bg-gray-50 dark:bg-gray-800/50",
        inList && "flex flex-wrap md:flex-nowrap justify-between items-center gap-4"
      )}>
        <div className="flex items-center gap-3 flex-1">
          {inList && (
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "border-none h-6 w-6",
                isPurchased ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500" : "bg-gray-100 dark:bg-gray-800"
              )}
              onClick={() => onTogglePurchased && onTogglePurchased(product.id)}
              disabled={!onTogglePurchased}
            >
              {isPurchased && <Check className="h-4 w-4" />}
            </Button>
          )}
          <div className="flex flex-col">
            <h3 className={cn(
              "font-medium text-gray-900 dark:text-white", 
              inList && isPurchased && "line-through text-gray-500 dark:text-gray-400"
            )}>
              {product.name}
            </h3>
            <div className="flex mt-1 gap-2 items-center">
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              {product.is_favorite && (
                <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
              )}
            </div>
          </div>
        </div>
        
        {inList ? (
          <div className="flex items-center">
            <div className="flex items-center border rounded-lg overflow-hidden h-9 bg-white dark:bg-gray-800">
              <Button
                variant="ghost"
                size="icon"
                className="h-full rounded-none w-9 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                onClick={() => onRemoveFromList && onRemoveFromList(product.id)}
                disabled={!onRemoveFromList}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-10 flex justify-center items-center font-medium">
                {quantity}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-full rounded-none w-9 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                onClick={() => onAddToList && onAddToList(product.id)}
                disabled={!onAddToList}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => onAddToList && onAddToList(product.id)}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            size="sm"
            disabled={!onAddToList}
          >
            <Plus className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            הוסף
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full flex flex-col border rounded-lg bg-white dark:bg-gray-800 shadow-sm transition-all",
      inList && isPurchased && "bg-gray-50 dark:bg-gray-800/50"
    )}>
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between">
          <h3 className={cn(
            "font-medium text-gray-900 dark:text-white", 
            inList && isPurchased && "line-through text-gray-500 dark:text-gray-400"
          )}>
            {product.name}
          </h3>
          {inList && (
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "border-none h-6 w-6",
                isPurchased ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500" : "bg-gray-100 dark:bg-gray-800"
              )}
              onClick={() => onTogglePurchased && onTogglePurchased(product.id)}
              disabled={!onTogglePurchased}
            >
              {isPurchased && <Check className="h-4 w-4" />}
            </Button>
          )}
        </div>
        
        <div className="flex mt-2 gap-2 items-center">
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
          {product.is_favorite && (
            <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" />
          )}
        </div>
      </div>
      
      <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 rounded-b-lg">
        {inList ? (
          <div className="flex justify-center">
            <div className="flex items-center border rounded-lg overflow-hidden h-9 bg-white dark:bg-gray-800">
              <Button
                variant="ghost"
                size="icon"
                className="h-full rounded-none w-9 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                onClick={() => onRemoveFromList && onRemoveFromList(product.id)}
                disabled={!onRemoveFromList}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="w-10 flex justify-center items-center font-medium">
                {quantity}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-full rounded-none w-9 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                onClick={() => onAddToList && onAddToList(product.id)}
                disabled={!onAddToList}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => onAddToList && onAddToList(product.id)}
            className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
            size="sm"
            disabled={!onAddToList}
          >
            <Plus className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" />
            הוסף
          </Button>
        )}
      </div>
    </div>
  );
}