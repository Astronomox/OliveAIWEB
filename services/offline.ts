// services/offline.ts — Offline sync and connectivity management
import { addToSyncQueue, getSyncQueue, clearSyncQueue } from "@/lib/db";
import { sendMessageToMama } from "./gemini";
import type { QueuedAction, SyncStatus } from "@/types";

/**
 * Check if the browser is currently online.
 */
export function isOnline(): boolean {
    if (typeof window === "undefined") return true;
    return window.navigator.onLine;
}

/**
 * Get the current sync status of the application.
 */
export async function getSyncStatus(): Promise<SyncStatus> {
    const queue = await getSyncQueue();
    const lastSynced = localStorage.getItem("olive-ai-last-sync");

    return {
        isOnline: isOnline(),
        lastSyncedAt: lastSynced,
        pendingActions: queue.length,
    };
}

/**
 * Process any actions that were queued while the user was offline.
 */
export async function processSyncQueue(): Promise<void> {
    if (!isOnline()) return;

    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    console.log(`[OfflineService] Syncing ${queue.length} pending actions...`);

    for (const action of queue) {
        try {
            if (action.type === "ai_query") {
                // Example: Retry a failed AI query
                const payload = action.payload as any;
                await sendMessageToMama({
                    message: payload.message,
                    language: payload.language,
                    conversationHistory: payload.history,
                });
            }
            // Add other sync logic here as needed
        } catch (error) {
            console.error(`[OfflineService] Failed to sync action ${action.id}:`, error);
            // Keep in queue for next retry or handle accordingly
            continue;
        }
    }

    // Clear queue after successful processing (or partial processing)
    await clearSyncQueue();
    localStorage.setItem("olive-ai-last-sync", new Date().toISOString());
}

/**
 * Initialize connectivity listeners.
 */
export function initConnectivityListeners(onStatusChange: (status: boolean) => void): () => void {
    if (typeof window === "undefined") return () => { };

    const handleOnline = () => {
        onStatusChange(true);
        processSyncQueue();
    };

    const handleOffline = () => {
        onStatusChange(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
    };
}
