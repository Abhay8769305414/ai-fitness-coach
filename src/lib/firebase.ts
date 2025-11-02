// src/lib/firebase.ts

import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged, 
    User,
    Auth,
    signInWithCustomToken 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    deleteDoc, 
    doc,
    Firestore,
    serverTimestamp,
    Query,
    CollectionReference,
    DocumentData
} from 'firebase/firestore';

// Firebase configuration - using a placeholder config for development
const firebaseConfig = {
  apiKey: "AIzaSyDummyApiKey123456789",
  authDomain: "ai-fitness-coach-app.firebaseapp.com",
  projectId: "ai-fitness-coach-app",
  storageBucket: "ai-fitness-coach-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase App
const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore and Auth instances
const db: Firestore = getFirestore(firebaseApp);
const auth: Auth = getAuth(firebaseApp);

/**
 * Initializes Firebase Authentication by signing in with the custom token or anonymously.
 */
export async function initializeFirebase() {
    if (!auth) {
        console.error("Firebase Auth is not initialized.");
        return { auth: null, db: null };
    }

    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            // Use custom token if provided (preferred for authenticated Canvas user)
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            // Sign in anonymously as a fallback
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Firebase Auth initialization failed:", error);
    }
    
    return { auth, db };
}

/**
 * Returns the global Auth instance.
 */
export function getAuthInstance(): Auth | undefined {
    return auth;
}

/**
 * Returns the current authenticated user's ID or 'anonymous' if not ready.
 */
export function getUserId(): string {
    return auth?.currentUser?.uid || 'anonymous';
}

/**
 * Gets the correct Firestore Collection Reference path based on the user ID.
 * Data is stored privately at: /artifacts/{appId}/users/{userId}/plans
 * @returns {CollectionReference} Firestore collection reference
 */
export function getPlansCollectionRef(): CollectionReference<DocumentData> | undefined {
    if (!db) {
        console.error("Firestore database is not initialized.");
        return undefined;
    }
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const userId = getUserId(); 
    
    // Path structure: /artifacts/{appId}/users/{userId}/plans
    const collectionPath = `artifacts/${appId}/users/${userId}/plans`;
    
    return collection(db, collectionPath);
}

// --- CRUD Operations ---

interface GeneratedPlan { 
    workout_plan: any[]; 
    diet_plan: any[]; 
    ai_tips: any;
}
interface PlanMetadata {
    name: string;
    goal: string;
    level: string;
}

/**
 * Saves a generated fitness plan to Firestore.
 * NOTE: The plan object is stringified to handle complex nested arrays easily.
 * @param plan The full generated plan object.
 * @param metadata Metadata about the plan (name, goal, level).
 */
export async function savePlanToDatabase(plan: GeneratedPlan, metadata: PlanMetadata) {
    const plansRef = getPlansCollectionRef();
    if (!plansRef) throw new Error("Could not get plans collection reference.");

    const dataToSave = {
        ...metadata,
        // CRITICAL: Stringify the complex JSON structure before saving to Firestore
        plan: JSON.stringify(plan), 
        createdAt: serverTimestamp(),
    };

    return await addDoc(plansRef, dataToSave);
}

/**
 * Sets up a real-time listener for the user's saved plans.
 * @param userId The current user's UID.
 * @param callback Function to execute with the list of plans whenever data changes.
 * @returns {() => void} Unsubscribe function to stop listening.
 */
export function listenForPlans(userId: string, callback: (plans: any[]) => void): () => void {
    const plansRef = getPlansCollectionRef();
    if (!plansRef) return () => {}; 

    // Query: Order by creation date descending
    const q: Query<DocumentData> = query(plansRef, orderBy("createdAt", "desc"));

    return onSnapshot(q, (snapshot) => {
        const plansList: any[] = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            let parsedPlan: GeneratedPlan | undefined;
            
            try {
                // CRITICAL: Parse the stringified JSON back into an object
                parsedPlan = JSON.parse(data.plan); 
            } catch(e) {
                console.error("Failed to parse plan JSON from Firestore document:", doc.id, e);
                return; // Skip this document
            }
            
            // Map the Firestore document to the SavedPlanMetadata interface
            plansList.push({
                id: doc.id,
                name: data.name,
                goal: data.goal,
                level: data.level,
                plan: parsedPlan, 
                // Convert Firestore Timestamp to JavaScript Date
                createdAt: data.createdAt?.toDate() || new Date(), 
            });
        });
        callback(plansList);
    });
}

/**
 * Deletes a specific plan document from Firestore.
 * @param planId The ID of the document to delete.
 */
export async function deletePlanFromDatabase(planId: string) {
    const plansRef = getPlansCollectionRef();
    if (!plansRef || !plansRef.firestore) throw new Error("Firestore is not initialized.");

    // Get a reference to the specific document
    const docRef = doc(plansRef.firestore, plansRef.path, planId);
    
    return await deleteDoc(docRef);
}
