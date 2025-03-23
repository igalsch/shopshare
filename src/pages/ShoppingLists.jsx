import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, ShoppingCart, Loader2, Pencil, Calendar, Users, Package, Trash2, AlertCircle, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import AppLayout from "@/components/layout/AppLayout"
import ShoppingListCard from "@/components/ShoppingListCard"
import * as listService from "@/services/listService"
import { supabase, getCurrentUser } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { ShoppingItem } from "@/entities/ShoppingItem"
import { ShareDialog } from '@/components/ShareDialog'
import { PendingInvitations } from '@/components/PendingInvitations'

// Sample mock data for testing
const mockLists = [
  {
    id: 1,
    name: "סופר שבועי",
    description: "רשימת קניות לסופר השבועי",
    items: 12,
    sharedWith: ["דני", "מיכל"],
    lastUpdated: "לפני שעה",
    status: "active",
    date: "יום ראשון, 10/03/2024",
    user_id: "mock-user-id"
  },
  {
    id: 2,
    name: "פארם",
    description: "מוצרי טיפוח ותרופות",
    items: 5,
    sharedWith: [],
    lastUpdated: "לפני יומיים",
    status: "completed",
    date: "יום שלישי, 05/03/2024",
    user_id: "mock-user-id"
  }
];

// Helper function to check if localStorage is available
const isLocalStorageAvailable = () => {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    console.error('localStorage is not available:', e);
    return false;
  }
};

// Loading state component
const LoadingLists = () => (
  <div className="flex flex-col items-center justify-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
    <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
    <h3 className="text-lg font-semibold mb-2 text-slate-100">טוען רשימות...</h3>
  </div>
)

// Empty state component
const EmptyState = ({ onCreateList }) => (
  <div className="flex flex-col items-center justify-center py-12 bg-slate-800/50 rounded-lg border border-slate-700">
    <ShoppingCart className="h-12 w-12 text-slate-300 mb-4" />
    <h3 className="text-lg font-semibold mb-2 text-slate-100">אין עדיין רשימות</h3>
    <p className="text-slate-300 text-center mb-4">צור את רשימת הקניות הראשונה שלך כדי להתחיל</p>
    <Button onClick={onCreateList} className="bg-emerald-500 hover:bg-emerald-600">
      <Plus className="ml-2 h-4 w-4" />
      צור רשימה
    </Button>
  </div>
)

const ShoppingLists = () => {
  const navigate = useNavigate()
  const localStorageAvailable = isLocalStorageAvailable();
  
  // Add user state
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("active")
  const [lists, setLists] = useState(() => {
    if (!localStorageAvailable) {
      console.warn('localStorage not available, using mock data');
      return mockLists;
    }
    
    try {
      const savedLists = localStorage.getItem('shoppingLists');
      console.log('Initial load - data from localStorage:', savedLists);
      
      if (savedLists && savedLists !== 'undefined' && savedLists !== 'null') {
        const parsedLists = JSON.parse(savedLists);
        if (Array.isArray(parsedLists) && parsedLists.length > 0) {
          console.log('Using saved lists from localStorage:', parsedLists);
          return parsedLists;
        }
      }
    } catch (error) {
      console.error('Error loading initial lists from localStorage:', error);
    }
    
    console.log('No valid saved lists found, returning empty array');
    return [];
  })
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [syncError, setSyncError] = useState(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState(null)
  
  // Create the ref at the component level
  const isInitialRender = useRef(true);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        // If not authenticated, redirect to login
        if (!currentUser) {
          navigate('/login');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setSyncError('Authentication error. Please log in again.');
      }
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          const user = session?.user;
          setUser(user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          navigate('/login');
        }
      }
    );
    
    return () => {
      // Clean up auth listener
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  // Load lists from API on component mount
  useEffect(() => {
    // Skip if not authenticated
    if (!user) {
      console.log('User not authenticated, skipping list fetch');
      return;
    }
    
    console.log('Loading lists for user:', user.id);
    
    const fetchLists = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching lists from API');
        const apiLists = await listService.getAllLists();
        console.log('Lists fetched from API:', apiLists);
        
        if (Array.isArray(apiLists)) {
          // Compare with current lists before updating
          const currentListsStr = JSON.stringify(lists.map(list => ({
            id: list.id,
            name: list.name,
            updated_at: list.updated_at
          })));
          
          const apiListsStr = JSON.stringify(apiLists.map(list => ({
            id: list.id,
            name: list.name,
            updated_at: list.updated_at
          })));
          
          if (currentListsStr !== apiListsStr) {
            console.log('API data differs from current state, updating');
            setLists(apiLists);
            
            // Update localStorage with the latest data from the server
            if (localStorageAvailable) {
              localStorage.setItem('shoppingLists', JSON.stringify(apiLists));
              console.log('Lists saved to localStorage');
            }
          } else {
            console.log('API data matches current state, no update needed');
          }
          
          setSyncError(null);
        } else {
          console.error('API returned invalid lists data (not an array):', apiLists);
          setSyncError('שגיאה בטעינת רשימות. התקבל מידע לא תקין מהשרת.');
        }
      } catch (error) {
        console.error('Failed to fetch lists from API:', error);
        setSyncError('Failed to sync with server. Using local data.');
        // Continue using localStorage data (already loaded in useState)
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [localStorageAvailable, user]);

  // Save lists to localStorage whenever they change and sync with server
  useEffect(() => {
    if (!localStorageAvailable) {
      console.warn('localStorage not available, changes will not persist');
      return;
    }
    
    // Skip initial render
    if (isInitialRender.current) {
      console.log('Skipping initial render for sync effect');
      isInitialRender.current = false;
      return;
    }
    
    // Skip if not authenticated
    if (!user) {
      console.log('User not authenticated, skipping sync');
      return;
    }
    
    console.log('Lists changed, saving to localStorage and syncing with server');
    
    // Save to localStorage
    try {
      localStorage.setItem('shoppingLists', JSON.stringify(lists));
      console.log('Lists saved to localStorage');
    } catch (error) {
      console.error('Error saving lists to localStorage:', error);
    }
    
    // Sync with server (debounced)
    const syncTimer = setTimeout(() => {
      console.log('Starting sync with server');
      
      if (!Array.isArray(lists) || lists.length === 0) {
        console.log('No lists to sync');
        return;
      }
      
      listService.syncLists(lists)
        .then(result => {
          console.log('Lists synced with server, received:', result);
          
          if (!result || !result.lists) {
            console.error('Invalid response from server');
            return;
          }
          
          // Compare lists by their content, not their stringified form
          const serverListsStr = JSON.stringify(result.lists.map(list => ({
            id: list.id,
            name: list.name,
            updated_at: list.updated_at
          })));
          
          const localListsStr = JSON.stringify(lists.map(list => ({
            id: list.id,
            name: list.name,
            updated_at: list.updated_at
          })));
          
          if (serverListsStr !== localListsStr) {
            console.log('Server data differs from local, updating local state');
            setLists(result.lists);
            localStorage.setItem('shoppingLists', JSON.stringify(result.lists));
          } else {
            console.log('Server data matches local data, no update needed');
          }
          
          setSyncError(null);
        })
        .catch(error => {
          console.error('Error syncing lists with server:', error);
          setSyncError('Failed to sync changes with server. Changes saved locally.');
        });
    }, 2000); // Debounce for 2 seconds
    
    // Cleanup timer on unmount or before next effect run
    return () => {
      console.log('Clearing sync timer');
      clearTimeout(syncTimer);
    };
  }, [lists, localStorageAvailable, user]);

  const handleCreateList = () => {
    if (!newListName.trim() || !user) return
    
    setIsLoading(true)
    
    // Create new list object with fields that match the Supabase schema
    const newList = {
      id: Date.now(), // Temporary ID, will be replaced by server
      name: newListName,
      user_id: user.id,
      status: "active" // Ensure the status is set to active when creating a new list
    }
    
    console.log('Creating new list:', newList);
    
    // Optimistically update UI - use a display version for the UI that has the fields we need for display
    const displayList = {
      ...newList,
      items: 0, // Default value for UI display
      sharedWith: [], // Default value for UI display
      date: new Date().toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }), // For UI display
      lastUpdated: "זה עתה", // For UI display
      description: "רשימת קניות חדשה", // For UI display
      status: "active" // Default status for UI
    };
    
    // Make sure lists is an array
    const currentLists = Array.isArray(lists) ? lists : [];
    const updatedLists = [displayList, ...currentLists];
    setLists(updatedLists);
    
    // Save to localStorage as backup
    if (localStorageAvailable) {
      localStorage.setItem('shoppingLists', JSON.stringify(updatedLists));
    }
    
    // Reset form
    setNewListName("");
    setIsCreateDialogOpen(false);
    
    // Send to server
    listService.createList(newList)
      .then(serverList => {
        // Update with server data (including server-generated ID)
        const listsWithServerData = updatedLists.map(list => 
          list.id === displayList.id ? { ...list, ...serverList } : list
        );
        setLists(listsWithServerData);
        
        // Update localStorage with server data
        if (localStorageAvailable) {
          localStorage.setItem('shoppingLists', JSON.stringify(listsWithServerData));
        }
        
        // Show success toast
        toast({
          title: "רשימה נוצרה בהצלחה",
          description: `הרשימה "${serverList.name}" נוצרה ונשמרה בשרת`,
        });
        
        // Navigate to the list detail page
        navigate(`/list-detail/${serverList.id}`);
      })
      .catch(error => {
        console.error('Error syncing new list with server:', error);
        setSyncError('Failed to sync new list with server. Changes saved locally.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  const handleDeleteList = async (listId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק רשימה זו?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Make sure lists is an array before filtering
      if (!Array.isArray(lists)) {
        console.error('Lists is not an array in handleDeleteList');
        setIsLoading(false);
        return;
      }
      
      // Optimistically update UI
      const updatedLists = lists.filter(list => list.id !== listId);
      setLists(updatedLists);
      
      // Update localStorage
      localStorage.setItem('shoppingLists', JSON.stringify(updatedLists));
      
      // Delete from server
      await listService.deleteList(listId);
      
      console.log('List deleted successfully');
      setIsLoading(false);
      
      // Show success message
      toast({
        title: "הרשימה נמחקה בהצלחה",
        description: "הרשימה נמחקה מהשרת",
      });
    } catch (error) {
      console.error('Error deleting list:', error);
      
      // Revert optimistic update on error
      const storedLists = JSON.parse(localStorage.getItem('shoppingLists') || '[]');
      setLists(storedLists);
      
      setIsLoading(false);
      setSyncError('Failed to delete list. Please try again.');
    }
  };

  const handleEditList = (id) => {
    // Make sure lists is an array before checking if the list exists
    if (!Array.isArray(lists)) {
      console.error('Lists is not an array in handleEditList');
      setSyncError('שגיאה בעריכת רשימה: נתוני הרשימות אינם תקינים');
      return;
    }
    
    // Check if the list exists
    const listExists = lists.some(list => list.id === id);
    if (!listExists) {
      console.error(`List with id ${id} not found`);
      setSyncError(`שגיאה בעריכת רשימה: רשימה עם מזהה ${id} לא נמצאה`);
      return;
    }
    
    navigate(`/edit-list/${id}`);
  }

  const handleContinueShopping = (id) => {
    // Make sure lists is an array before checking if the list exists
    if (!Array.isArray(lists)) {
      console.error('Lists is not an array in handleContinueShopping');
      setSyncError('שגיאה בהמשך קניות: נתוני הרשימות אינם תקינים');
      return;
    }
    
    // Check if the list exists
    const listExists = lists.some(list => list.id === id);
    if (!listExists) {
      console.error(`List with id ${id} not found`);
      setSyncError(`שגיאה בהמשך קניות: רשימה עם מזהה ${id} לא נמצאה`);
      return;
    }
    
    navigate(`/list-detail/${id}`);
  }

  // Filter lists based on active tab
  const filteredLists = Array.isArray(lists) ? lists.filter(list => {
    if (activeTab === "all") return true;
    return list.status === activeTab; // Ensure filtering is based on the status
  }) : [];

  const handleSyncWithServer = async () => {
    if (!user) {
      setSyncError('יש להתחבר כדי לסנכרן רשימות');
      return;
    }
    
    setIsLoading(true);
    setSyncError(null);
    
    try {
      console.log('Syncing lists with server...');
      const result = await listService.syncLists(lists);
      
      if (result._not_synced) {
        console.error('Sync error:', result._error);
        setSyncError(`שגיאה בסנכרון: ${result._error}`);
        return;
      }
      
      console.log('Sync successful, updated lists:', result.lists);
      
      // Make sure result.lists is an array
      if (Array.isArray(result.lists)) {
        setLists(result.lists);
        
        // Update localStorage
        if (localStorageAvailable) {
          localStorage.setItem('shoppingLists', JSON.stringify(result.lists));
        }
      } else {
        console.error('Sync returned invalid lists data (not an array):', result.lists);
        setSyncError('שגיאה בסנכרון: התקבל מידע לא תקין מהשרת');
        return;
      }
      
      // Show success message
      toast({
        title: "סנכרון הושלם בהצלחה",
        description: `${result.syncResults?.length || 0} רשימות עודכנו`,
      });
    } catch (error) {
      console.error('Error syncing with server:', error);
      setSyncError(`שגיאה בסנכרון: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateList = async (updatedList) => {
    try {
      setIsLoading(true);
      
      // Make sure lists is an array before mapping
      if (!Array.isArray(lists)) {
        console.error('Lists is not an array in handleUpdateList');
        setIsLoading(false);
        return;
      }
      
      // Optimistically update UI
      const updatedLists = lists.map(list => 
        list.id === updatedList.id ? { ...list, ...updatedList } : list
      );
      setLists(updatedLists);
      
      // Update localStorage
      localStorage.setItem('shoppingLists', JSON.stringify(updatedLists));
      
      // Update on server
      await listService.updateList(updatedList);
      
      console.log('List updated successfully');
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating list:', error);
      
      // Revert optimistic update on error
      const storedLists = JSON.parse(localStorage.getItem('shoppingLists') || '[]');
      setLists(storedLists);
      
      setIsLoading(false);
      setSyncError('Failed to update list. Please try again.');
    }
  };

  const handleDuplicateList = async (list) => {
    try {
        // Create the new list first
        const duplicatedList = {
            ...list,
            id: Date.now(), // Generate a new ID for the duplicated list
            name: `${list.name} (Copy)`, // Modify the name to indicate it's a copy
            date: new Date().toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }), // Update date
            lastUpdated: "זה עתה", // Reset last updated time
            status: "active" // Set status to active for the new list
        };

        // Optimistically update UI with the new list
        const updatedLists = [duplicatedList, ...lists];
        setLists(updatedLists);

        // Save to localStorage as backup
        if (localStorageAvailable) {
            localStorage.setItem('shoppingLists', JSON.stringify(updatedLists));
        }

        // Send to server to create the new list
        const serverList = await listService.createList(duplicatedList);
        
        if (serverList._not_synced) {
            throw new Error(serverList._error || 'Failed to create list on server');
        }

        // Get the items from the original list
        const originalItems = await ShoppingItem.getByListId(list.id);
        
        // Create new items for the duplicated list
        for (const item of originalItems) {
            await ShoppingItem.create({
                listId: serverList.id,
                productId: item.product_id,
                quantity: item.quantity
            });
        }

        // Fetch the complete new list with its items
        const completeList = await listService.getListById(serverList.id);
        
        // Update lists state with the complete new list
        const listsWithServerData = lists.map(item => 
            item.id === duplicatedList.id ? completeList : item
        );
        setLists(listsWithServerData);

        // Update localStorage with server data
        if (localStorageAvailable) {
            localStorage.setItem('shoppingLists', JSON.stringify(listsWithServerData));
        }

        // Show success toast
        toast({
            title: "רשימה הועתקה בהצלחה",
            description: `הרשימה "${serverList.name}" הועתקה עם כל הפריטים ונשמרה בשרת`,
        });

        // Navigate to the new list
        navigate(`/list-detail/${serverList.id}`);
    } catch (error) {
        console.error('Error duplicating list:', error);
        setSyncError('Failed to duplicate list. Please try again.');
        toast({
            title: "שגיאה בהעתקת הרשימה",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  const handleShareList = (listId) => {
    setSelectedListId(listId)
    setIsShareDialogOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">רשימות הקניות שלי</h2>
            <p className="text-slate-400">נהל את רשימות הקניות שלך ושתף אותן עם אחרים</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600">
                <Plus className="ml-2 h-4 w-4" />
                רשימה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white rtl">
              <DialogHeader>
                <DialogTitle>צור רשימה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">שם הרשימה</Label>
                  <Input
                    id="name"
                    placeholder="הכנס שם לרשימה"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              </div>
              <div className="flex justify-start space-x-reverse space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-700 text-slate-200 hover:text-slate-100">
                  ביטול
                </Button>
                <Button onClick={handleCreateList} disabled={isLoading || !newListName.trim()} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      יוצר...
                    </>
                  ) : (
                    "צור רשימה"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Invitations */}
        <PendingInvitations />

        {/* Sync Error Alert */}
        {syncError && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאת סנכרון</AlertTitle>
            <AlertDescription>{syncError}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700 w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">הכל</TabsTrigger>
            <TabsTrigger value="active" className="relative flex-1 sm:flex-none">
              פעיל
              <Badge className="absolute -top-2 -right-2 bg-emerald-500">
                {Array.isArray(lists) ? lists.filter(list => list.status === 'active').length : 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="relative flex-1 sm:flex-none">
              הושלם
              <Badge className="absolute -top-2 -right-2 bg-emerald-500">
                {Array.isArray(lists) ? lists.filter(list => list.status === 'completed').length : 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="relative flex-1 sm:flex-none">
              בארכיון
              <Badge className="absolute -top-2 -right-2 bg-emerald-500">
                {Array.isArray(lists) ? lists.filter(list => list.status === 'archived').length : 0}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Main Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full">
              <LoadingLists />
            </div>
          ) : filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <div key={list.id}>
                <ShoppingListCard 
                  list={list} 
                  onDelete={handleDeleteList}
                  onDuplicate={handleDuplicateList}
                  onShare={handleShareList}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState onCreateList={() => setIsCreateDialogOpen(true)} />
            </div>
          )}
        </div>

        {/* Share Dialog */}
        <ShareDialog
          isOpen={isShareDialogOpen}
          onClose={() => {
            setIsShareDialogOpen(false)
            setSelectedListId(null)
          }}
          listId={selectedListId}
        />
      </div>
    </AppLayout>
  )
}

export default ShoppingLists