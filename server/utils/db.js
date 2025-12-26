const admin = require('firebase-admin');

// Initialize Firebase Admin
// Note: On Render, you should set GOOGLE_APPLICATION_CREDENTIALS environment variable
// pointing to a path with the service account key, OR use base64 encoded JSON in a variable.
if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // If we have the JSON string in an env var (good for Render)
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback for local dev (expects Google Application Credentials to be set or default)
        admin.initializeApp();
    }
}

const db = admin.firestore();

// Helper to read all documents from a collection (Simulates File Read)
const readData = async (collection) => {
    try {
        const snapshot = await db.collection(collection).get();
        return snapshot.docs.map(doc => {
            // Ensure _id matches doc.id
            return { _id: doc.id, ...doc.data() };
        });
    } catch (error) {
        console.error(`Error reading ${collection}:`, error);
        return [];
    }
};

// Helper to write data (Simulates File Write - Full Sync)
// This updates/adds items and DELETES items missing from the array
const writeData = async (collection, data) => {
    try {
        if (!Array.isArray(data)) return false;

        const batch = db.batch();
        const collectionRef = db.collection(collection);
        
        // Get all current document IDs to identify deletions
        // Note: For large collections, this is expensive.
        const snapshot = await collectionRef.select('__name__').get();
        const existingIds = new Set(snapshot.docs.map(doc => doc.id));
        const newIds = new Set();

        let operationCount = 0;

        for (const item of data) {
            // Use _id if present, otherwise ignore or generate?
            // The app expects items to have IDs if they are being updated.
            const docId = item._id || item.id; 
            
            if (docId) {
                const sDocId = String(docId);
                newIds.add(sDocId);
                
                const docRef = collectionRef.doc(sDocId);
                const cleanItem = JSON.parse(JSON.stringify(item));
                batch.set(docRef, cleanItem, { merge: true });
                operationCount++;
            }
        }
        
        // Delete items that are no longer in the array
        for (const existingId of existingIds) {
            if (!newIds.has(existingId)) {
                batch.delete(collectionRef.doc(existingId));
                operationCount++;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }
        return true;
    } catch (error) {
        console.error(`Error writing ${collection}:`, error);
        return false;
    }
};

module.exports = { readData, writeData, db };
