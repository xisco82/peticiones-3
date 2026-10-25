import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

async function verifyUsers() {
  const usersColl = collection(db, 'users');
  const snap = await getDocs(usersColl);
  console.log(`Found ${snap.size} user documents in Google Cloud Firestore:`);
  snap.forEach(d => {
    const data = d.data();
    console.log(` - [${d.id}] ${data.name} | DNI: ${data.dni || 'N/A'} | Rol: ${data.role}`);
  });
}

verifyUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error verifying users in Firestore:', err);
    process.exit(1);
  });
