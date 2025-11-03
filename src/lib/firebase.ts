// src/lib/firebase.ts
// Robust Firebase helper for Next.js (modular SDK)
// - Reads config from: globalThis.__firebase_config (if present) OR process.env.NEXT_PUBLIC_FIREBASE_CONFIG
// - Exports initializeFirebase, getPlansCollectionRef, savePlanToFirestore, deletePlanFromFirestore, getUserId

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, User } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  CollectionReference,
  DocumentData,
  serverTimestamp,
  Firestore,
  query,
  orderBy,
} from "firebase/firestore";

/**
 * Safely obtain firebase config:
 * 1. If you injected a global at runtime (globalThis.__firebase_config), prefer that.
 * 2. Else look for NEXT_PUBLIC_FIREBASE_CONFIG env var (stringified JSON).
 * 3. Else null.
 */
function getFirebaseConfigRaw(): unknown | null {
  try {
    const maybeGlobal = (globalThis as any).__firebase_config;
    if (typeof maybeGlobal !== "undefined" && maybeGlobal !== null) {
      return maybeGlobal;
    }
  } catch (e) {
    // ignore
  }

  const env = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (env) {
    try {
      return JSON.parse(env);
    } catch (e) {
      // Could be already JSON object in some runtimes; try to return as-is
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (process.env as any).NEXT_PUBLIC_FIREBASE_CONFIG;
      } catch {
        return null;
      }
    }
  }

  return null;
}

let _firebaseApp: FirebaseApp | null = null;
let _firestore: Firestore | null = null;
let _authUser: User | null = null;

/**
 * Initialize Firebase app (idempotent).
 * Call this before using other helpers. On the client this will also attempt anonymous auth so you
 * have an auth user for user-scoped data.
 */
export async function initializeFirebase(): Promise<void> {
  if (_firebaseApp && getApps().length > 0) return;

  const raw = getFirebaseConfigRaw();
  if (!raw) {
    // If you want to allow local development without a config, you can console.warn here.
    console.warn(
      "No Firebase config found. Set NEXT_PUBLIC_FIREBASE_CONFIG in .env.local (stringified JSON), or provide globalThis.__firebase_config"
    );
    return;
  }

  // raw may be object or string; ensure it's a plain object for initializeApp
  const firebaseConfig =
    typeof raw === "string" ? JSON.parse(raw as string) : (raw as Record<string, unknown>);

  _firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  _firestore = getFirestore(_firebaseApp);

  // Setup auth and sign in anonymously if not signed in (client-only behavior)
  try {
    const auth = getAuth(_firebaseApp);
    // track current user
    onAuthStateChanged(auth, (user) => {
      if (user) {
        _authUser = user;
      } else {
        // Attempt anonymous sign-in if no user (safe on client)
        // Avoid in server-side contexts (Next server) because signInAnonymously uses client-side features.
        if (typeof window !== "undefined") {
          signInAnonymously(auth).catch((err) => {
            console.warn("Anonymous sign-in failed:", err);
          });
        }
      }
    });
  } catch (e) {
    // If auth is not available in this environment or fails, keep going.
    console.warn("Firebase auth initialization warning:", e);
  }
}

/** Returns Firestore collection reference for "plans" or throws if Firestore isn't initialized */
export function getPlansCollectionRef(): CollectionReference<DocumentData> | null {
  if (!_firestore) {
    if (!_firebaseApp) {
      console.warn("Firebase app not initialized. Call initializeFirebase() first.");
      return null;
    }
    _firestore = getFirestore(_firebaseApp);
  }
  return collection(_firestore, "plans");
}

/** Save a plan to Firestore. plan may be an object; this function stringifies it for storage. */
export async function savePlanToFirestore(plan: unknown, metadata: { name: string; goal: string; level: string }) {
  const col = getPlansCollectionRef();
  if (!col) throw new Error("Firestore not initialized");

  // Store the plan as JSON string so it's easy to validate later
  const payload = {
    name: metadata.name,
    goal: metadata.goal,
    level: metadata.level,
    plan: typeof plan === "string" ? plan : JSON.stringify(plan),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(col, payload);
  return docRef.id;
}

/** Delete a plan document by ID */
export async function deletePlanFromFirestore(id: string) {
  if (!_firestore) {
    if (!_firebaseApp) throw new Error("Firestore not initialized");
    _firestore = getFirestore(_firebaseApp);
  }
  const d = doc(_firestore!, "plans", id);
  await deleteDoc(d);
}

/** Returns current user id if available, otherwise null */
export function getUserId(): string | null {
  if (_authUser) return _authUser.uid;
  try {
    // Try to get auth user from the client-side SDK
    if (_firebaseApp) {
      const auth = getAuth(_firebaseApp);
      return auth.currentUser?.uid ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Optional helper: build a simple query ordered by createdAt desc */
export function getPlansQuery() {
  if (!_firestore) {
    if (!_firebaseApp) throw new Error("Firestore not initialized");
    _firestore = getFirestore(_firebaseApp);
  }
  return query(collection(_firestore!, "plans"), orderBy("createdAt", "desc"));
}
