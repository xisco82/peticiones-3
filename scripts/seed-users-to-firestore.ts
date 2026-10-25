import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const dbJsonPath = path.resolve(process.cwd(), 'data/database.json');
const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));

async function seedUsers() {
  console.log(`Starting to seed ${dbData.users.length} users to Firestore...`);
  for (const user of dbData.users) {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`Saved user to Firestore: ${user.name} (${user.id}) [DNI: ${user.dni || 'N/A'}]`);
  }
  console.log('Successfully saved all employees in Firestore database!');
}

seedUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error saving users to Firestore:', err);
    process.exit(1);
  });
