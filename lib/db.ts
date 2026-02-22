// lib/db.ts — IndexedDB setup for offline-first storage using idb
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
    NAFDACDrug,
    Conversation,
    MedicationReminder,
    UserProfile,
    HealthLogEntry,
    AccessibilitySettings,
    DrugScanResult,
    QueuedAction,
} from "@/types";

/** Database schema definition */
interface OliveAIDB extends DBSchema {
    drugs: {
        key: string;
        value: NAFDACDrug;
        indexes: {
            "by-name": string;
            "by-generic": string;
            "by-nafdac": string;
        };
    };
    pregnancyChecks: {
        key: string;
        value: DrugScanResult & { id: string };
        indexes: { "by-date": string };
    };
    conversations: {
        key: string;
        value: Conversation;
        indexes: { "by-date": string };
    };
    reminders: {
        key: string;
        value: MedicationReminder;
        indexes: { "by-active": number };
    };
    userProfile: {
        key: string;
        value: UserProfile;
    };
    healthLog: {
        key: string;
        value: HealthLogEntry;
        indexes: { "by-date": string };
    };
    settings: {
        key: string;
        value: AccessibilitySettings;
    };
    syncQueue: {
        key: string;
        value: QueuedAction;
        indexes: { "by-date": string };
    };
}

const DB_NAME = "olive-ai-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<OliveAIDB> | null = null;

/** Initialize and return the IndexedDB instance (singleton) */
export async function getDB(): Promise<IDBPDatabase<OliveAIDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<OliveAIDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Drugs store with search indexes
            if (!db.objectStoreNames.contains("drugs")) {
                const drugStore = db.createObjectStore("drugs", { keyPath: "id" });
                drugStore.createIndex("by-name", "name");
                drugStore.createIndex("by-generic", "generic_name");
                drugStore.createIndex("by-nafdac", "nafdac_number");
            }

            // Pregnancy check history
            if (!db.objectStoreNames.contains("pregnancyChecks")) {
                const pcStore = db.createObjectStore("pregnancyChecks", { keyPath: "id" });
                pcStore.createIndex("by-date", "scannedAt");
            }

            // Conversation history
            if (!db.objectStoreNames.contains("conversations")) {
                const convStore = db.createObjectStore("conversations", { keyPath: "id" });
                convStore.createIndex("by-date", "updatedAt");
            }

            // Medication reminders
            if (!db.objectStoreNames.contains("reminders")) {
                const remStore = db.createObjectStore("reminders", { keyPath: "id" });
                remStore.createIndex("by-active", "isActive");
            }

            // User profile (single record)
            if (!db.objectStoreNames.contains("userProfile")) {
                db.createObjectStore("userProfile", { keyPath: "id" });
            }

            // Health log entries
            if (!db.objectStoreNames.contains("healthLog")) {
                const hlStore = db.createObjectStore("healthLog", { keyPath: "id" });
                hlStore.createIndex("by-date", "date");
            }

            // Settings
            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings", { keyPath: "id" });
            }

            // Offline sync queue
            if (!db.objectStoreNames.contains("syncQueue")) {
                const sqStore = db.createObjectStore("syncQueue", { keyPath: "id" });
                sqStore.createIndex("by-date", "createdAt");
            }
        },
    });

    return dbInstance;
}

/* ═══════════════════════════════════════════════
   User Profile Operations
   ═══════════════════════════════════════════════ */

export async function getUserProfile(): Promise<UserProfile | undefined> {
    const db = await getDB();
    return db.get("userProfile", "main");
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
    const db = await getDB();
    await db.put("userProfile", { ...profile, id: "main", updatedAt: new Date().toISOString() });
}

/* ═══════════════════════════════════════════════
   Drug Operations
   ═══════════════════════════════════════════════ */

export async function getAllDrugs(): Promise<NAFDACDrug[]> {
    const db = await getDB();
    return db.getAll("drugs");
}

export async function getDrugById(id: string): Promise<NAFDACDrug | undefined> {
    const db = await getDB();
    return db.get("drugs", id);
}

export async function searchDrugs(query: string): Promise<NAFDACDrug[]> {
    const db = await getDB();
    const allDrugs = await db.getAll("drugs");
    const lower = query.toLowerCase();
    return allDrugs.filter(
        (d) =>
            d.name.toLowerCase().includes(lower) ||
            d.generic_name.toLowerCase().includes(lower) ||
            d.nafdac_number.toLowerCase().includes(lower)
    );
}

export async function seedDrugs(drugs: NAFDACDrug[]): Promise<void> {
    const db = await getDB();
    const tx = db.transaction("drugs", "readwrite");
    for (const drug of drugs) {
        await tx.store.put(drug);
    }
    await tx.done;
}

/* ═══════════════════════════════════════════════
   Conversation Operations
   ═══════════════════════════════════════════════ */

export async function getAllConversations(): Promise<Conversation[]> {
    const db = await getDB();
    const all = await db.getAll("conversations");
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
    const db = await getDB();
    return db.get("conversations", id);
}

export async function saveConversation(conv: Conversation): Promise<void> {
    const db = await getDB();
    await db.put("conversations", conv);
}

export async function deleteConversation(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("conversations", id);
}

export async function clearAllConversations(): Promise<void> {
    const db = await getDB();
    await db.clear("conversations");
}

/* ═══════════════════════════════════════════════
   Reminder Operations
   ═══════════════════════════════════════════════ */

export async function getAllReminders(): Promise<MedicationReminder[]> {
    const db = await getDB();
    return db.getAll("reminders");
}

export async function saveReminder(reminder: MedicationReminder): Promise<void> {
    const db = await getDB();
    await db.put("reminders", reminder);
}

export async function deleteReminder(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("reminders", id);
}

/* ═══════════════════════════════════════════════
   Settings Operations
   ═══════════════════════════════════════════════ */

const DEFAULT_SETTINGS: AccessibilitySettings & { id: string } = {
    id: "main",
    textSize: "medium",
    highContrast: false,
    voiceSpeed: "normal",
    autoReadResults: false,
    darkMode: false,
};

export async function getSettings(): Promise<AccessibilitySettings> {
    const db = await getDB();
    const settings = await db.get("settings", "main");
    return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AccessibilitySettings): Promise<void> {
    const db = await getDB();
    await db.put("settings", { ...settings, id: "main" } as AccessibilitySettings & { id: string });
}

/* ═══════════════════════════════════════════════
   Health Log Operations
   ═══════════════════════════════════════════════ */

export async function getHealthLogs(): Promise<HealthLogEntry[]> {
    const db = await getDB();
    const all = await db.getAll("healthLog");
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function saveHealthLog(entry: HealthLogEntry): Promise<void> {
    const db = await getDB();
    await db.put("healthLog", entry);
}

/* ═══════════════════════════════════════════════
   Pregnancy Check Operations
   ═══════════════════════════════════════════════ */

export async function getPregnancyChecks(): Promise<(DrugScanResult & { id: string })[]> {
    const db = await getDB();
    const all = await db.getAll("pregnancyChecks");
    return all.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
}

export async function savePregnancyCheck(check: DrugScanResult & { id: string }): Promise<void> {
    const db = await getDB();
    await db.put("pregnancyChecks", check);
}

/* ═══════════════════════════════════════════════
   Sync Queue Operations
   ═══════════════════════════════════════════════ */

export async function addToSyncQueue(action: QueuedAction): Promise<void> {
    const db = await getDB();
    await db.put("syncQueue", action);
}

export async function getSyncQueue(): Promise<QueuedAction[]> {
    const db = await getDB();
    return db.getAll("syncQueue");
}

export async function clearSyncQueue(): Promise<void> {
    const db = await getDB();
    await db.clear("syncQueue");
}
