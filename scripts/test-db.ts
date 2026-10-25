import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('Testing Firestore connection to:');
console.log('Project ID:', config.projectId);
console.log('Database ID:', config.firestoreDatabaseId);

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const start = Date.now();
  try {
    const docRef = doc(db, 'test', 'connection');
    const snap = await getDocFromServer(docRef);
    const duration = Date.now() - start;
    console.log('SUCCESS! Connected to Firestore database in', duration, 'ms');
    console.log('Document exists:', snap.exists());
    process.exit(0);
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error('ERROR connecting to Firestore after', duration, 'ms:');
    console.error(err.code || err.message || err);
    process.exit(1);
  }
}

run();
