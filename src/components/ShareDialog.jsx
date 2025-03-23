import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShareService } from '@/services/ShareService'
import { toast } from '@/components/ui/use-toast'
import { Users, Mail, Loader2, X, Check, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function ShareDialog({ isOpen, onClose, listId }) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState('editor')
  const [isLoading, setIsLoading] = useState(false)
  const [sharedUsers, setSharedUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    if (isOpen && listId) {
      loadSharedUsers()
    }
  }, [isOpen, listId])

  const loadSharedUsers = async () => {
    try {
      const users = await ShareService.getSharedUsers(listId)
      setSharedUsers(users)
    } catch (error) {
      toast({
        title: 'שגיאה בטעינת משתמשים',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleShare = async () => {
    if (!email) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין כתובת אימייל',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await ShareService.shareList(listId, email, permission)
      toast({
        title: 'הזמנה נשלחה',
        description: `הזמנה נשלחה ל-${email}`,
      })
      setEmail('')
      await loadSharedUsers()
    } catch (error) {
      toast({
        title: 'שגיאה בשיתוף',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveShare = async (userId) => {
    try {
      await ShareService.removeShare(listId, userId)
      toast({
        title: 'השיתוף הוסר',
        description: 'המשתמש הוסר מהרשימה המשותפת',
      })
      await loadSharedUsers()
    } catch (error) {
      toast({
        title: 'שגיאה בהסרת שיתוף',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const handleUpdatePermission = async (userId, newPermission) => {
    try {
      await ShareService.updatePermission(listId, userId, newPermission)
      toast({
        title: 'הרשאות עודכנו',
        description: 'הרשאות המשתמש עודכנו בהצלחה',
      })
      await loadSharedUsers()
    } catch (error) {
      toast({
        title: 'שגיאה בעדכון הרשאות',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-slate-100">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              שיתוף רשימה
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            שתף את הרשימה עם משתמשים אחרים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Form */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-slate-200">
                הזמן משתמשים
              </Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  placeholder="הזן כתובת אימייל..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-slate-800 border-slate-700 text-slate-100"
                />
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="editor">עורך</SelectItem>
                    <SelectItem value="viewer">צופה</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleShare}
                  disabled={isLoading || !email}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Shared Users List */}
            <div className="space-y-2">
              <Label className="text-slate-200">משתמשים משותפים</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {loadingUsers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 text-slate-400 animate-spin" />
                  </div>
                ) : sharedUsers.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      הרשימה אינה משותפת עם אף משתמש
                    </p>
                  </div>
                ) : (
                  sharedUsers.map((share) => (
                    <div
                      key={share.shared_with_id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-slate-800/50 border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Shield className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-100">
                            {share.profiles?.full_name || share.profiles?.email}
                          </div>
                          <div className="text-sm text-slate-400">
                            {share.profiles?.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Select
                          value={share.permission_level}
                          onValueChange={(newValue) =>
                            handleUpdatePermission(share.shared_with_id, newValue)
                          }
                        >
                          <SelectTrigger className="h-8 w-[100px] bg-slate-800 border-slate-700 text-slate-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="editor">עורך</SelectItem>
                            <SelectItem value="viewer">צופה</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveShare(share.shared_with_id)}
                          className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-300"
          >
            סגור
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 