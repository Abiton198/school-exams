/**
 * Full Firestore multi-collection migration script (ES Module version)
 * 1) npm install firebase-admin
 * 2) Put your serviceAccountKey.json in the project root
 * 3) Run: node migrateFirestore.mjs
 */

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

// Load your service account JSON
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// === CONFIG ===
const COLLECTIONS_TO_MIGRATE = [
  'admins',
  'students',
  'teachers',
  'parents',
  'exams',
  'examResults',
  'examFiles',
  'messages',
  'parentComments',
  'studentAnswers',
];

const NEW_SCHOOL_ID = 'gC6vruap88SFYFfaLNv6'; // ✅ Your schoolId

async function migrateCollection(collectionName) {
  console.log(`\n🚀 Migrating collection: ${collectionName}`);

  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`✔️  No documents found in ${collectionName}`);
    return;
  }

  for (const doc of snapshot.docs) {
    const oldData = doc.data();

    const newDocRef = db
      .collection('schools')
      .doc(NEW_SCHOOL_ID)
      .collection(collectionName)
      .doc(doc.id);

    // Write to new nested path
    await newDocRef.set(oldData);
    console.log(`✅ Copied ${collectionName}/${doc.id}`);

    // Optional: Delete old doc AFTER verifying copy
    // await db.collection(collectionName).doc(doc.id).delete();
    // console.log(`🗑️ Deleted old ${collectionName}/${doc.id}`);
  }

  console.log(`✔️ Finished migrating ${collectionName}`);
}

async function migrateAll() {
  for (const collectionName of COLLECTIONS_TO_MIGRATE) {
    await migrateCollection(collectionName);
  }

  console.log('\n🎉 All collections migrated! Double-check Firestore before deleting old data.');
}

migrateAll().catch(console.error);
