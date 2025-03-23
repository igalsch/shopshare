import { supabase } from '@/lib/supabaseClient'
import { v4 as uuidv4 } from 'uuid'

export class ShareService {
  static async shareList(listId, inviteeEmail, permissionLevel) {
    try {
      // First check if the user is already shared with
      const { data: existingShare } = await supabase
        .from('list_shares')
        .select('*')
        .eq('list_id', listId)
        .eq('user_id', inviteeEmail)
        .single()

      if (existingShare) {
        throw new Error('This list is already shared with this user')
      }

      // Create invitation token
      const invitationToken = uuidv4()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Create invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('share_invitations')
        .insert({
          list_id: listId,
          created_by: user.id,
          recipient_email: inviteeEmail,
          token: invitationToken,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
        })
        .select()
        .single()

      if (invitationError) throw invitationError

      return invitation
    } catch (error) {
      console.error('Error sharing list:', error)
      throw error
    }
  }

  static async acceptInvitation(invitationToken) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get and validate invitation
      const { data: invitation } = await supabase
        .from('share_invitations')
        .select('*')
        .eq('token', invitationToken)
        .eq('status', 'pending')
        .single()

      if (!invitation) {
        throw new Error('Invalid or expired invitation')
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired')
      }

      // Begin transaction
      const { data: share, error: shareError } = await supabase
        .from('list_shares')
        .insert({
          list_id: invitation.list_id,
          user_id: user.id,
          permission: invitation.permission || 'read'
        })
        .select()
        .single()

      if (shareError) throw shareError

      // Update invitation status
      const { error: updateError } = await supabase
        .from('share_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      return share
    } catch (error) {
      console.error('Error accepting invitation:', error)
      throw error
    }
  }

  static async getSharedUsers(listId) {
    try {
      const { data, error } = await supabase
        .from('list_shares')
        .select(`
          user_id,
          permission,
          created_at,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .eq('list_id', listId)

      if (error) throw error

      return data.map(share => ({
        shared_with_id: share.user_id,
        permission_level: share.permission,
        created_at: share.created_at,
        profiles: share.profiles
      }))
    } catch (error) {
      console.error('Error getting shared users:', error)
      throw error
    }
  }

  static async removeShare(listId, userId) {
    try {
      const { error } = await supabase
        .from('list_shares')
        .delete()
        .eq('list_id', listId)
        .eq('user_id', userId)

      if (error) throw error

      return true
    } catch (error) {
      console.error('Error removing share:', error)
      throw error
    }
  }

  static async updatePermission(listId, userId, newPermissionLevel) {
    try {
      const { data, error } = await supabase
        .from('list_shares')
        .update({ permission: newPermissionLevel })
        .eq('list_id', listId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error updating permission:', error)
      throw error
    }
  }

  static async getPendingInvitations() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('share_invitations')
        .select('*')
        .eq('recipient_email', user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error getting pending invitations:', error)
      throw error
    }
  }
} 