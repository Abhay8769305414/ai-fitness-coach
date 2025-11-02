// src/lib/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, doc, setDoc, deleteDoc, serverTimestamp, CollectionReference } from 'firebase/firestore';

// --- Global Variables (Provided by Canvas/Environment) ---
// Note: In Vercel, this must be fetched from process.env.NEXT_PUBLIC_FIREBASE_CONFIG
const firebaseConfigRaw = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Use the public configuration variable for Vercel deployment if local config is null
const firebaseConfigJson = firebaseConfigRaw 
    ? JSON.parse(firebaseConfigRaw) 
    : (process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : null);

if (!firebaseConfigJson) {
    console.error("FIREBASE ERROR: NEXT_PUBLIC_FIREBASE_CONFIG is not set. Database functions will not work.");
}

// --- Initialization ---
let app: any = null;
let db: any = null;
let auth: any = null;
let currentUser: User | null = null;
let userId: string | null = null;

if (firebaseConfigJson) {
    try {
        app = initializeApp(firebaseConfigJson);
        db = getFirestore(app);
        auth = getAuth(app);
    } catch (e) {
        console.error("FIREBASE INIT ERROR:", e);
    }
}

/**
 * Initializes authentication and sets the current user state.
 */
export async function initializeAuth(): Promise<void> {
    if (!auth) return;

    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                userId = user.uid;
            } else {
                if (initialAuthToken) {
                    // Sign in with Canvas token
                    await signInWithCustomToken(auth, initialAuthToken).catch(e => {
                        console.error("Custom token sign-in failed:", e);
                    });
                } else {
                    // Sign in anonymously as a fallback
                    const anonUser = await signInAnonymously(auth).catch(e => {
                        console.error("Anonymous sign-in failed:", e);
                    });
                    if (anonUser) {
                        currentUser = anonUser.user;
                        userId = anonUser.user.uid;
                    }
                }
            }
            // Ensure userId is set before resolving
            if (currentUser && !userId) {
                userId = currentUser.uid;
            }
            
            // Only resolve once the state has settled
            unsubscribe();
            resolve();
        });
    });
}

/**
 * Returns the current authenticated user ID.
 */
export function getUserId(): string {
    return userId || 'anonymous';
}

/**
 * Gets a reference to the user's private plans collection.
 */
export function getPlansCollectionRef(): CollectionReference | undefined {
    if (!db || !userId) return undefined;
    // MANDATORY FIRESTORE PATH: /artifacts/{appId}/users/{userId}/{your_collection_name}
    const appId = "ai-fitness-coach-app"; 
    const path = `/artifacts/${appId}/users/${userId}/plans`;
    return collection(db, path);
}

/**
 * Saves a plan to Firestore.
 */
export async function savePlanToFirestore(plan: any, metadata: { name: string, goal: string, level: string }): Promise<void> {
    const plansRef = getPlansCollectionRef();
    if (!plansRef) {
        console.error("Cannot save plan: Firestore not initialized or user not authenticated.");
        return;
    }
    
    // Store metadata and the plan (serialized to JSON string for safe storage)
    await addDoc(plansRef, {
        ...metadata,
        plan: JSON.stringify(plan),
        userId: userId,
        createdAt: serverTimestamp()
    });
}

/**
 * Deletes a plan from Firestore.
 */
export async function deletePlanFromFirestore(planId: string): Promise<void> {
    const plansRef = getPlansCollectionRef();
    if (!plansRef) {
        console.error("Cannot delete plan: Firestore not initialized or user not authenticated.");
        return;
    }
    await deleteDoc(doc(plansRef, planId));
}

// Export initialization function and references for use in components
export { initializeAuth as initializeFirebase, db, auth };
