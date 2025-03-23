import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Package,
  ShoppingCart,
  History,
  Menu,
  X,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { User } from "@/entities/User"

const navigation = [
  {
    name: "רשימות קניות",
    href: "/shopping-lists",
    icon: ShoppingCart,
  },
  {
    name: "מוצרים",
    href: "/products",
    icon: Package,
  },
  {
    name: "היסטוריה",
    href: "/history",
    icon: History,
  },
]

const AppLayout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (href) => {
    navigate(href)
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Desktop Sidebar - Right Side */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between">
            <span className="text-xl font-semibold text-white">ShopShare</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-x-3",
                          location.pathname === item.href
                            ? "bg-slate-800 text-emerald-400"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                        onClick={() => handleNavigate(item.href)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-x-3 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={async () => {
                    await User.logout();
                    navigate('/login');
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  התנתק
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-64 overflow-y-auto bg-slate-900 px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-semibold text-white">ShopShare</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5 text-slate-400" />
              </Button>
            </div>
            <nav className="flex flex-col h-full">
              <ul role="list" className="flex-1 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-x-3",
                        location.pathname === item.href
                          ? "bg-slate-800 text-emerald-400"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                      onClick={() => handleNavigate(item.href)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Button>
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                className="w-full justify-start gap-x-3 text-slate-400 hover:text-white hover:bg-slate-800"
                onClick={async () => {
                  await User.logout();
                  navigate('/login');
                }}
              >
                <LogOut className="h-5 w-5" />
                התנתק
              </Button>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 lg:hidden">
        <nav className="flex justify-around">
          <Button
            variant="ghost"
            size="icon"
            className="flex-none p-3 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              size="lg"
              className={cn(
                "flex-1 flex flex-col items-center py-3 px-1 gap-1",
                location.pathname === item.href
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-white"
              )}
              onClick={() => handleNavigate(item.href)}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="pb-20 lg:pb-10 lg:pr-72">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AppLayout 