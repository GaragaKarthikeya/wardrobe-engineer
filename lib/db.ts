/**
 * IndexedDB Wrapper for Wardrobe Items
 * Provides local caching for offline-first experience
 */

import { ClothingItem } from '@/types';

const DB_NAME = 'wardrobe-db';
const DB_VERSION = 1;
const STORE_NAME = 'items';
const META_STORE = 'meta';

let dbInstance: IDBDatabase | null = null;

/**
 * Open/create the IndexedDB database
 */
async function getDB(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Items store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('created_at', 'created_at', { unique: false });
                store.createIndex('is_clean', 'is_clean', { unique: false });
            }

            // Meta store for sync timestamps
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE, { keyPath: 'key' });
            }
        };
    });
}

/**
 * Get all items from local database
 */
export async function getLocalItems(): Promise<ClothingItem[]> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result as ClothingItem[];
                // Sort by created_at descending (newest first)
                items.sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                resolve(items);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to get local items:', error);
        return [];
    }
}

/**
 * Save multiple items to local database (replaces all)
 */
export async function saveLocalItems(items: ClothingItem[]): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Clear existing items first
            store.clear();

            // Add all new items
            for (const item of items) {
                store.put(item);
            }

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('Failed to save local items:', error);
    }
}

/**
 * Add or update a single item
 */
export async function saveLocalItem(item: ClothingItem): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to save local item:', error);
    }
}

/**
 * Delete an item from local database
 */
export async function deleteLocalItem(id: string): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to delete local item:', error);
    }
}

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<number | null> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(META_STORE, 'readonly');
            const store = transaction.objectStore(META_STORE);
            const request = store.get('lastSync');

            request.onsuccess = () => {
                resolve(request.result?.value || null);
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to get last sync:', error);
        return null;
    }
}

/**
 * Set last sync timestamp
 */
export async function setLastSync(timestamp: number): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(META_STORE, 'readwrite');
            const store = transaction.objectStore(META_STORE);
            const request = store.put({ key: 'lastSync', value: timestamp });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to set last sync:', error);
    }
}

/**
 * Check if local database has any items
 */
export async function hasLocalData(): Promise<boolean> {
    const items = await getLocalItems();
    return items.length > 0;
}

/**
 * Clear all local data
 */
export async function clearLocalData(): Promise<void> {
    try {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORE_NAME, META_STORE], 'readwrite');
            transaction.objectStore(STORE_NAME).clear();
            transaction.objectStore(META_STORE).clear();

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('Failed to clear local data:', error);
    }
}
