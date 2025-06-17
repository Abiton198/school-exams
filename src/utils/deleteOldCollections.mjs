// deleteOldCollections.mjs

// !run : node deleteOldCollections.mjs

import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const OLD_COLLECTIONS = [
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

async function deleteCollection(collectionName) {
  console.log(`\n🗑️ Deleting collection: ${collectionName}`);

  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`✔️  No documents found in ${collectionName}`);
    return;
  }

  for (const doc of snapshot.docs) {
    await db.collection(collectionName).doc(doc.id).delete();
    console.log(`✅ Deleted ${collectionName}/${doc.id}`);
  }

  console.log(`✔️ Finished deleting ${collectionName}`);
}

async function deleteAll() {
  for (const collectionName of OLD_COLLECTIONS) {
    await deleteCollection(collectionName);
  }

  console.log('\n🎉 All old collections deleted!');
}

deleteAll().catch(console.error);
