import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User"; 
import { 
  ShoppingCart, 
  List, 
  Clock, 
  Package, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Computer,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("מערכת");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await User.me();
        setUserData(user);
        setTheme(user.preferred_theme || "מערכת");
      } catch (error) {
        console.error("שגיאה בטעינת נתוני משתמש:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (userData && userData.preferred_theme !== theme) {
      updateUserTheme(theme);
    }
  }, [theme]);

  const updateUserTheme = async (newTheme) => {
    try {
      await User.updateMyUserData({ preferred_theme: newTheme });
    } catch (error) {
      console.error("שגיאה בעדכון ערכת נושא:", error);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const applySystemTheme = () => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", isDarkMode);
  };

  const applyTheme = () => {
    if (theme === "מערכת") {
      applySystemTheme();
    } else {
      document.documentElement.classList.toggle("dark", theme === "כהה");
    }
  };

  useEffect(() => {
    applyTheme();
    
    if (theme === "מערכת") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applySystemTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const isActive = (pageName) => {
    return location.pathname === createPageUrl(pageName);
  };

  const navigation = [
    { name: "רשימות קניות", href: "ShoppingLists", icon: ShoppingCart },
    { name: "רשימה כללית", href: "GeneralList", icon: List },
    { name: "היסטוריה", href: "History", icon: Clock },
    { name: "מוצרים", href: "Products", icon: Package }
  ];

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <style jsx="true">{`
        :root {
          --background: 0 0% 100%;
          --foreground: 240 10% 3.9%;
          --primary: 142.1 76.2% 36.3%;
          --primary-foreground: 355.7 100% 97.3%;
          --card: 0 0% 100%;
          --card-foreground: 240 10% 3.9%;
          --border: 240 5.9% 90%;
          --input: 240 5.9% 90%;
          --ring: 142.1 76.2% 36.3%;
        }
        .dark {
          --background: 240 10% 3.9%;
          --foreground: 0 0% 98%;
          --primary: 142.1 70.6% 45.3%;
          --primary-foreground: 144.9 80.4% 10%;
          --card: 240 10% 3.9%;
          --card-foreground: 0 0% 98%;
          --border: 240 3.7% 15.9%;
          --input: 240 3.7% 15.9%;
          --ring: 142.4 71.8% 29.2%;
        }
        html, body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
      `}</style>

      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-500" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">רשימת קניות</h1>
        </div>
        {currentPageName === "ShoppingLists" && (
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl("CreateList")}>
              <Plus className="h-5 w-5" />
            </Link>
          </Button>
        )}
      </header>

      <div className="flex flex-1 relative">
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={cn(
            "fixed top-0 right-0 z-40 w-64 h-full transition-transform bg-white border-l border-gray-200 shadow-lg lg:shadow-none dark:bg-gray-800 dark:border-gray-700 lg:translate-x-0 lg:relative lg:w-64 lg:shrink-0",
            sidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 h-16 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <ShoppingCart className="h-7 w-7 text-green-600 dark:text-green-500" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">רשימת קניות</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col justify-between h-[calc(100%-4rem)]">
            <div className="px-3 py-4">
              {!loading && userData && (
                <div className="mb-6 px-3 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">שלום</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {userData.display_name || userData.full_name || "משתמש"}
                  </p>
                </div>
              )}

              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        to={createPageUrl(item.href)}
                        className={cn(
                          "flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-md text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400"
                            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <p className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">ערכת נושא</p>
                <div className="flex items-center space-x-2 rtl:space-x-reverse px-2">
                  <Button
                    variant={theme === "בהיר" ? "default" : "outline"}
                    size="icon"
                    className="w-9 h-9"
                    onClick={() => handleThemeChange("בהיר")}
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={theme === "כהה" ? "default" : "outline"}
                    size="icon"
                    className="w-9 h-9"
                    onClick={() => handleThemeChange("כהה")}
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={theme === "מערכת" ? "default" : "outline"}
                    size="icon"
                    className="w-9 h-9"
                    onClick={() => handleThemeChange("מערכת")}
                  >
                    <Computer className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                onClick={() => User.logout()}
              >
                <LogOut className="h-5 w-5 ml-2 rtl:mr-2 rtl:ml-0" />
                התנתקות
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-0 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 right-0 left-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-2 flex justify-around items-center lg:hidden z-10">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.href)}
              className={cn(
                "flex flex-col items-center py-1 px-2 rounded-md transition-colors",
                active 
                  ? "text-green-600 dark:text-green-500" 
                  : "text-gray-500 dark:text-gray-400"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
