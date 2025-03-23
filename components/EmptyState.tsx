import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function EmptyState({ 
  title, 
  description, 
  icon: Icon, 
  actionText, 
  actionLink,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 max-w-md mx-auto my-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="h-8 w-8 text-gray-400 dark:text-gray-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      {actionText && (
        onAction ? (
          <Button onClick={onAction} className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
            {actionText}
          </Button>
        ) : (
          <Button asChild className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
            <Link to={createPageUrl(actionLink)}>{actionText}</Link>
          </Button>
        )
      )}
    </div>
  );
}