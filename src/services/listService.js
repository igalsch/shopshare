import { supabase } from '@/lib/supabase';

// Get all shopping lists
export const getAllLists = async () => {
  try {
    console.log('Fetching all lists from Supabase');
    
    // Get user ID from current session
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) {
      console.warn('No authenticated user found, returning empty list');
      return [];
    }
    
    // Fetch lists for the current user with item counts
    const { data, error } = await supabase
      .from('shopping_lists')
      .select(`
        *,
        items:shopping_items(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Supabase error fetching lists:', error);
      throw error;
    }
    
    console.log('Lists fetched successfully from DB:', data);
    
    // Convert DB format to UI display format
    const displayLists = (data || []).map(dbList => ({
      ...dbList,
      items: dbList.items?.[0]?.count || 0, // Use the count from the items subquery
      sharedWith: [], // Default value for UI display
      date: new Date(dbList.created_at || Date.now()).toLocaleDateString('he-IL', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      lastUpdated: dbList.updated_at ? new Date(dbList.updated_at).toLocaleDateString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : "זה עתה",
      description: dbList.description || "רשימת קניות", // Use DB description if available
      status: dbList.status || "active" // Use DB status if available
    }));
    
    console.log('Lists converted to UI format:', displayLists);
    return displayLists;
  } catch (error) {
    console.error('Error fetching lists from Supabase:', error);
    // Return localStorage data as fallback
    try {
      const localLists = localStorage.getItem('shoppingLists');
      const parsedLists = localLists ? JSON.parse(localLists) : [];
      console.log('Using localStorage fallback for lists:', parsedLists);
      return parsedLists;
    } catch (localError) {
      console.error('Error reading from localStorage:', localError);
      return [];
    }
  }
};

// Get a single shopping list by ID
export const getListById = async (id) => {
  try {
    console.log('Fetching list with ID:', id);
    
    if (!id) {
      console.error('No ID provided for list fetch');
      return null;
    }
    
    const { data, error } = await supabase
      .from('shopping_lists')
      .select(`
        *,
        items:shopping_items(count)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Supabase error fetching list:', error);
      throw error;
    }
    
    console.log('List fetched successfully from DB:', data);
    
    // Convert DB format to UI display format
    const displayList = data ? {
      ...data,
      items: data.items?.[0]?.count || 0, // Use the count from the items subquery
      sharedWith: [], // Default value for UI display
      date: new Date(data.created_at || Date.now()).toLocaleDateString('he-IL', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      lastUpdated: data.updated_at ? new Date(data.updated_at).toLocaleDateString('he-IL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : "זה עתה",
      description: data.description || "רשימת קניות", // Use DB description if available
      status: data.status || "active" // Use DB status if available
    } : null;
    
    console.log('List converted to UI format:', displayList);
    return displayList;
  } catch (error) {
    console.error('Error fetching list from Supabase:', error);
    
    // Return localStorage data as fallback
    try {
      const localLists = localStorage.getItem('shoppingLists');
      if (localLists) {
        const lists = JSON.parse(localLists);
        const localList = lists.find(list => list.id === id);
        console.log('Using localStorage fallback for list:', localList);
        return localList || null;
      }
    } catch (localError) {
      console.error('Error reading from localStorage:', localError);
    }
    
    return null;
  }
};

// Create a new shopping list
export const createList = async (list) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user found when creating list');
      return { 
        ...list, 
        _not_synced: true, 
        _error: 'User not authenticated' 
      };
    }

    // Prepare data for Supabase - only include fields that exist in the schema
    const listData = {
      name: list.name,
      user_id: user.id,
      // created_at and updated_at will be handled by Supabase
    };

    console.log('Sending list data to Supabase:', listData);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('shopping_lists')
      .insert(listData)
      .select()
      .single();

    if (error) {
      console.error('Error creating list in Supabase:', error);
      return { 
        ...list, 
        _not_synced: true, 
        _error: error.message 
      };
    }

    console.log('List created in Supabase:', data);
    return data;
  } catch (error) {
    console.error('Exception creating list:', error);
    
    // If localStorage is available, save to localStorage as fallback
    if (typeof localStorage !== 'undefined') {
      try {
        const lists = JSON.parse(localStorage.getItem('shoppingLists')) || [];
        lists.unshift(list);
        localStorage.setItem('shoppingLists', JSON.stringify(lists));
      } catch (localStorageError) {
        console.error('Error saving to localStorage:', localStorageError);
      }
    }
    
    return { 
      ...list, 
      _not_synced: true, 
      _error: error.message 
    };
  }
};

// Update an existing shopping list
export const updateList = async (list) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user found when updating list');
      return { 
        ...list, 
        _not_synced: true, 
        _error: 'User not authenticated' 
      };
    }

    // Ensure we have an ID
    if (!list.id) {
      console.error('Cannot update list without ID');
      return { 
        ...list, 
        _not_synced: true, 
        _error: 'Missing list ID' 
      };
    }

    // Prepare data for Supabase update
    const { data, error } = await supabase
      .from('shopping_lists')
      .update({ 
        name: list.name,
        description: list.description,
        status: list.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', list.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating list in Supabase:', error);
      return { 
        ...list, 
        _not_synced: true, 
        _error: error.message 
      };
    }

    console.log('List updated in Supabase:', data);

    // Update localStorage
    try {
      const lists = JSON.parse(localStorage.getItem('shoppingLists')) || [];
      const updatedLists = lists.map(l => l.id === list.id ? {
        ...l,
        name: data.name,
        description: data.description,
        status: data.status,
        updated_at: data.updated_at,
        date: new Date(data.created_at).toLocaleDateString('he-IL', { 
          weekday: 'long', 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }),
        lastUpdated: new Date(data.updated_at).toLocaleDateString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      } : l);
      
      localStorage.setItem('shoppingLists', JSON.stringify(updatedLists));
      console.log('List updated in localStorage');
      
      return {
        ...data,
        date: new Date(data.created_at).toLocaleDateString('he-IL', { 
          weekday: 'long', 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        }),
        lastUpdated: new Date(data.updated_at).toLocaleDateString('he-IL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    } catch (error) {
      console.error('Error updating list in localStorage:', error);
      return data;
    }
  } catch (error) {
    console.error('Exception updating list:', error);
    return { 
      ...list, 
      _not_synced: true, 
      _error: error.message 
    };
  }
};

// Delete a shopping list
export const deleteList = async (id) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('No authenticated user found when deleting list');
      return { 
        id, 
        _not_synced: true, 
        _error: 'User not authenticated' 
      };
    }

    // Ensure we have an ID
    if (!id) {
      console.error('Cannot delete list without ID');
      return { 
        id, 
        _not_synced: true, 
        _error: 'Missing list ID' 
      };
    }

    console.log('Deleting list from Supabase:', id);

    // Delete from Supabase
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting list from Supabase:', error);
      return { 
        id, 
        _not_synced: true, 
        _error: error.message 
      };
    }

    console.log('List deleted from Supabase:', id);
    
    // If localStorage is available, delete from localStorage as well
    if (typeof localStorage !== 'undefined') {
      try {
        const lists = JSON.parse(localStorage.getItem('shoppingLists')) || [];
        
        // Make sure lists is an array before filtering
        if (!Array.isArray(lists)) {
          console.error('Lists is not an array in deleteList localStorage update');
          return { id, success: true };
        }
        
        const updatedLists = lists.filter(list => list.id !== id);
        localStorage.setItem('shoppingLists', JSON.stringify(updatedLists));
      } catch (localStorageError) {
        console.error('Error updating localStorage after delete:', localStorageError);
      }
    }
    
    return { id, success: true };
  } catch (error) {
    console.error('Exception deleting list:', error);
    return { 
      id, 
      _not_synced: true, 
      _error: error.message 
    };
  }
};

// Sync local lists with server
export const syncLists = async (localLists) => {
  try {
    // Make sure localLists is an array
    if (!Array.isArray(localLists)) {
      console.error('localLists is not an array in syncLists');
      return { 
        lists: [], 
        _not_synced: true, 
        _error: 'Invalid local lists data (not an array)' 
      };
    }
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found in syncLists');
      return { 
        lists: localLists, 
        _not_synced: true, 
        _error: 'User not authenticated' 
      };
    }
    
    console.log('Starting sync process with local lists:', localLists);

    // Get all lists from server
    const { data: serverLists, error: fetchError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching lists from Supabase:', fetchError);
      return { 
        lists: localLists, 
        _not_synced: true, 
        _error: fetchError.message 
      };
    }

    console.log('Server lists:', serverLists);

    // Convert local lists to server format for comparison
    const localListsServerFormat = localLists.map(list => {
      // Skip lists that are already marked as not synced
      if (list._not_synced) {
        return list;
      }

      return {
        id: list.id,
        name: list.name,
        items: list.items || [],
        items_count: list.items_count || (typeof list.items === 'number' ? list.items : 0),
        shared_with: list.shared_with || list.sharedWith || [],
        status: list.status || 'active',
        user_id: user.id
      };
    });

    // Find lists that need to be created or updated on the server
    const listsToSync = localListsServerFormat.filter(localList => {
      // Skip lists that are already marked as not synced
      if (localList._not_synced) {
        return false;
      }

      // If it's a client-generated ID (timestamp), it needs to be created on server
      if (typeof localList.id === 'number' && localList.id > 1000000000) {
        return true;
      }

      // Check if it exists on server
      const serverList = serverLists.find(sl => sl.id === localList.id);
      if (!serverList) {
        return true; // Doesn't exist on server, needs to be created
      }

      // Check if it's different from server version
      return JSON.stringify(localList) !== JSON.stringify(serverList);
    });

    console.log('Lists that need to be synced:', listsToSync);

    // Sync each list
    const syncResults = await Promise.all(
      listsToSync.map(async (list) => {
        try {
          // If it's a client-generated ID, create new on server
          if (typeof list.id === 'number' && list.id > 1000000000) {
            const { id, ...listWithoutId } = list;
            const result = await createList(listWithoutId);
            return { 
              originalId: id, 
              result, 
              action: 'create' 
            };
          } else {
            // Otherwise update existing
            const result = await updateList(list);
            return { 
              originalId: list.id, 
              result, 
              action: 'update' 
            };
          }
        } catch (error) {
          console.error(`Error syncing list ${list.id}:`, error);
          return { 
            originalId: list.id, 
            error: error.message, 
            action: 'error' 
          };
        }
      })
    );

    console.log('Sync results:', syncResults);

    // Get fresh data from server after sync
    const { data: updatedServerLists, error: refreshError } = await supabase
      .from('shopping_lists')
      .select(`
        *,
        items:shopping_items(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (refreshError) {
      console.error('Error refreshing lists from Supabase after sync:', refreshError);
      return { 
        lists: localLists, 
        _not_synced: true, 
        _error: refreshError.message,
        syncResults 
      };
    }
    
    // Make sure updatedServerLists is an array
    if (!Array.isArray(updatedServerLists)) {
      console.error('updatedServerLists is not an array in syncLists');
      return { 
        lists: localLists, 
        _not_synced: true, 
        _error: 'Invalid server lists data (not an array)',
        syncResults 
      };
    }

    // Convert server lists to display format
    const displayLists = updatedServerLists.map(serverList => ({
      ...serverList,
      items: serverList.items?.[0]?.count || 0, // Use the count from the items subquery
      sharedWith: [], // Default value for UI display since shared_with doesn't exist in schema
      date: new Date(serverList.created_at || Date.now()).toLocaleDateString('he-IL', { 
        weekday: 'long', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      lastUpdated: serverList.updated_at 
        ? new Date(serverList.updated_at).toLocaleDateString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) 
        : "זה עתה",
      description: serverList.description || "רשימת קניות", // Use DB description if available
      status: serverList.status || "active" // Use DB status if available
    }));

    console.log('Updated display lists after sync:', displayLists);

    // Update localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('shoppingLists', JSON.stringify(displayLists));
    }

    return { 
      lists: displayLists, 
      syncResults 
    };
  } catch (error) {
    console.error('Exception during sync process:', error);
    return { 
      lists: localLists, 
      _not_synced: true, 
      _error: error.message 
    };
  }
};

export const shareList = async (listId, inviteeEmail, permissionLevel) => {
  try {
    // First check if the user is already shared with
    const { data: existingShare } = await supabase
      .from('list_shares')
      .select('*')
      .eq('list_id', listId)
      .eq('shared_with_id', inviteeEmail)
      .single()

    if (existingShare) {
      throw new Error('This list is already shared with this user')
    }

    // Create invitation token
    const invitationToken = crypto.randomUUID()
    
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

export const acceptInvitation = async (invitationToken) => {
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
        owner_id: invitation.created_by,
        shared_with_id: user.id,
        permission_level: invitation.permission_level,
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

export const getSharedUsers = async (listId) => {
  try {
    const { data, error } = await supabase
      .from('list_shares')
      .select(`
        shared_with_id,
        permission_level,
        created_at,
        profiles:shared_with_id (
          email,
          full_name
        )
      `)
      .eq('list_id', listId)

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting shared users:', error)
    throw error
  }
}

export const removeShare = async (listId, userId) => {
  try {
    const { error } = await supabase
      .from('list_shares')
      .delete()
      .eq('list_id', listId)
      .eq('shared_with_id', userId)

    if (error) throw error

    return true
  } catch (error) {
    console.error('Error removing share:', error)
    throw error
  }
}

export const updatePermission = async (listId, userId, newPermissionLevel) => {
  try {
    const { data, error } = await supabase
      .from('list_shares')
      .update({ permission_level: newPermissionLevel })
      .eq('list_id', listId)
      .eq('shared_with_id', userId)
      .select()
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating permission:', error)
    throw error
  }
}

export const getPendingInvitations = async () => {
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
      .lt('expires_at', new Date().toISOString())

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting pending invitations:', error)
    throw error
  }
} 