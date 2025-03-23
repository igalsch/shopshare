import React, { useState, useEffect } from 'react'
import { ShareService } from '@/services/ShareService'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, X, Loader2, Mail } from 'lucide-react'

export function PendingInvitations() {
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState(new Set())

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      const data = await ShareService.getPendingInvitations()
      setInvitations(data)
    } catch (error) {
      console.error('Error loading invitations:', error)
      toast({
        title: 'שגיאה בטעינת הזמנות',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitationToken) => {
    setProcessingIds(prev => new Set([...prev, invitationToken]))
    try {
      await ShareService.acceptInvitation(invitationToken)
      setInvitations(prev => prev.filter(inv => inv.invitation_token !== invitationToken))
      toast({
        title: 'ההזמנה התקבלה',
        description: 'הרשימה משותפת איתך כעת',
      })
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast({
        title: 'שגיאה בקבלת ההזמנה',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(invitationToken)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (invitations.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <Card
          key={invitation.invitation_token}
          className="p-4 bg-slate-800/50 border-slate-700"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium text-slate-100">
                  הזמנה לשיתוף רשימה
                </div>
                <div className="text-sm text-slate-400">
                  הוזמנת להיות {invitation.permission_level === 'editor' ? 'עורך' : 'צופה'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAcceptInvitation(invitation.invitation_token)}
                disabled={processingIds.has(invitation.invitation_token)}
                className="hover:bg-emerald-500/10 hover:text-emerald-500"
              >
                {processingIds.has(invitation.invitation_token) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 