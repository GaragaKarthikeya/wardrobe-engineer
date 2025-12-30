/**
 * Sync Logic for Local DB <-> Supabase
 * Handles background synchronization
 */

import { supabase } from './supabase';
import { ClothingItem } from '@/types';
import {
    getLocalItems,
    saveLocalItems,
    saveLocalItem,
    deleteLocalItem,
    getLastSync,
    setLastSync
} from './db';

// Minimum time between syncs (5 seconds)
const MIN_SYNC_INTERVAL = 5000;
let isSyncing = false;
let lastSyncAttempt = 0;

/**
 * Sync items from Supabase to local database
 * Returns true if sync was successful, false if skipped/failed
 */
export async function syncFromServer(): Promise<{ success: boolean; items: ClothingItem[] }> {
    // Prevent concurrent syncs
    if (isSyncing) {
        const localItems = await getLocalItems();
        return { success: false, items: localItems };
    }

    // Rate limit syncs
    const now = Date.now();
    if (now - lastSyncAttempt < MIN_SYNC_INTERVAL) {
        const localItems = await getLocalItems();
        return { success: false, items: localItems };
    }

    try {
        isSyncing = true;
        lastSyncAttempt = now;

        // Fetch from Supabase
        const { data, error } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const serverItems = (data || []) as ClothingItem[];

        // Save to local database
        await saveLocalItems(serverItems);
        await setLastSync(Date.now());

        return { success: true, items: serverItems };
    } catch (error) {
        console.error('Sync from server failed:', error);
        // Return local items on failure
        const localItems = await getLocalItems();
        return { success: false, items: localItems };
    } finally {
        isSyncing = false;
    }
}

/**
 * Load items with cache-first strategy
 * Instantly returns local data, then syncs in background
 */
export async function loadItemsCacheFirst(
    onLocalData: (items: ClothingItem[]) => void,
    onServerData: (items: ClothingItem[]) => void
): Promise<void> {
    // 1. Immediately show local data
    const localItems = await getLocalItems();
    if (localItems.length > 0) {
        onLocalData(localItems);
    }

    // 2. Sync from server in background
    const { success, items } = await syncFromServer();

    // 3. Update with server data if different
    if (success && items.length > 0) {
        onServerData(items);
    } else if (localItems.length === 0 && items.length > 0) {
        // First load with no local data
        onServerData(items);
    }
}

/**
 * Add item locally and sync to server
 */
export async function addItem(item: ClothingItem): Promise<void> {
    // Save locally first (instant)
    await saveLocalItem(item);

    // Sync will happen on next full sync
}

/**
 * Update item locally and sync to server
 */
export async function updateItem(id: string, updates: Partial<ClothingItem>): Promise<void> {
    // Get current item
    const localItems = await getLocalItems();
    const item = localItems.find(i => i.id === id);
    if (!item) return;

    // Update locally
    const updatedItem = { ...item, ...updates };
    await saveLocalItem(updatedItem);

    // Sync to server
    try {
        await supabase.from('items').update(updates).eq('id', id);
    } catch (error) {
        console.error('Failed to sync update to server:', error);
    }
}

/**
 * Delete item locally and from server
 */
export async function removeItem(id: string, imageUrl: string): Promise<void> {
    // Delete locally first (instant feedback)
    await deleteLocalItem(id);

    // Sync deletion to server
    try {
        await supabase.from('items').delete().eq('id', id);
        const file = imageUrl.split('/').pop();
        if (file) {
            await supabase.storage.from('wardrobe').remove([file]);
        }
    } catch (error) {
        console.error('Failed to sync deletion to server:', error);
    }
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Get sync status for UI
 */
export async function getSyncStatus(): Promise<{
    lastSync: number | null;
    isOnline: boolean;
    isSyncing: boolean;
}> {
    return {
        lastSync: await getLastSync(),
        isOnline: isOnline(),
        isSyncing
    };
}
