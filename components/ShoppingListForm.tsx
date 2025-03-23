import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingList } from "@/entities/ShoppingList";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

export default function ShoppingListForm({ listId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);
  const [listData, setListData] = useState({
    title: "",
    description: "",
    shopping_date: "",
    shared_with: []
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await User.me();
        setUserData(user);
      } catch (error) {
        console.error("שגיאה בטעינת נתוני המשתמש:", error);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (listId) {
      const loadList = async () => {
        setLoading(true);
        try {
          const list = await ShoppingList.get(listId);
          setListData(list);
        } catch (error) {
          console.error("שגיאה בטעינת רשימת הקניות:", error);
        } finally {
          setLoading(false);
        }
      };

      loadList();
    }
  }, [listId]);

  const handleChange = (field, value) => {
    setListData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date) => {
    handleChange("shopping_date", date);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (listId) {
        await ShoppingList.update(listId, listData);
      } else {
        const newList = await ShoppingList.create({
          ...listData,
          status: "פעילה"
        });
      }
      
      navigate(createPageUrl("ShoppingLists"));
    } catch (error) {
      console.error("שגיאה בשמירת רשימת הקניות:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 rtl:ml-2 rtl:mr-0"
          onClick={() => navigate(createPageUrl("ShoppingLists"))}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {listId ? "עריכת רשימת קניות" : "רשימת קניות חדשה"}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">כותרת הרשימה</Label>
                <Input
                  id="title"
                  value={listData.title}
                  onChange={e => handleChange("title", e.target.value)}
                  placeholder="לדוגמה: קניות לשבת"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור (אופציונלי)</Label>
                <Textarea
                  id="description"
                  value={listData.description || ""}
                  onChange={e => handleChange("description", e.target.value)}
                  placeholder="פרטים נוספים על הרשימה"
                  rows={3}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>תאריך הקנייה (אופציונלי)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right rtl:text-left"
                  >
                    <CalendarIcon className="ml-2 rtl:mr-2 rtl:ml-0 h-4 w-4" />
                    {listData.shopping_date ? (
                      format(new Date(listData.shopping_date), "EEEE, d/MM/yyyy")
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">בחר תאריך</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={listData.shopping_date ? new Date(listData.shopping_date) : undefined}
                    onSelect={handleDateChange}
                    dir="rtl"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {userData?.partner_email && (
              <div className="flex items-center justify-between space-y-0">
                <Label htmlFor="share_with_partner" className="cursor-pointer">
                  שתף עם {userData.partner_email}
                </Label>
                <Switch
                  id="share_with_partner"
                  checked={listData.shared_with?.includes(userData.partner_email)}
                  onCheckedChange={value => {
                    const shared = value 
                      ? [...(listData.shared_with || []), userData.partner_email]
                      : (listData.shared_with || []).filter(email => email !== userData.partner_email);
                    handleChange("shared_with", shared);
                  }}
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl("ShoppingLists"))}
              disabled={saving}
            >
              ביטול
            </Button>
            <Button type="submit" disabled={saving} className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700">
              {saving ? (
                <>
                  <Loader2 className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4 animate-spin" />
                  שומר...
                </>
              ) : (
                listId ? "עדכן רשימה" : "צור רשימה"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
