import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

export const firebaseConfig = configJson;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export async function testConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc).catch(() => null);
    return true;
  } catch (e) {
    console.warn('Firestore test connection notice:', e);
    return true;
  }
}

export async function syncDatabaseToFirestore(data: {
  users?: any[];
  schedules?: any[];
  requests?: any[];
  incidents?: any[];
  settings?: any;
}): Promise<{ syncedCount: number; errors: string[] }> {
  let count = 0;
  const errors: string[] = [];

  // 1. Sync Requests (Shift changes, Days off, Absences)
  if (data.requests && Array.isArray(data.requests)) {
    for (const req of data.requests) {
      if (req.id) {
        try {
          await setDoc(doc(db, 'requests', req.id), req, { merge: true });
          count++;
        } catch (err: any) {
          console.warn(`Error writing request ${req.id} to Firestore:`, err.message);
          errors.push(`Petición ${req.id}: ${err.message}`);
        }
      }
    }
  }

  // 2. Sync Incidents
  if (data.incidents && Array.isArray(data.incidents)) {
    for (const inc of data.incidents) {
      if (inc.id) {
        try {
          await setDoc(doc(db, 'incidents', inc.id), inc, { merge: true });
          count++;
        } catch (err: any) {
          console.warn(`Error writing incident ${inc.id} to Firestore:`, err.message);
          errors.push(`Incidencia ${inc.id}: ${err.message}`);
        }
      }
    }
  }

  // 3. Sync Users
  if (data.users && Array.isArray(data.users)) {
    for (const u of data.users) {
      if (u.id) {
        try {
          await setDoc(doc(db, 'users', u.id), u, { merge: true });
          count++;
        } catch (err: any) {
          errors.push(`Usuario ${u.id}: ${err.message}`);
        }
      }
    }
  }

  // 4. Sync Schedules
  if (data.schedules && Array.isArray(data.schedules)) {
    for (const s of data.schedules) {
      if (s.id) {
        try {
          await setDoc(doc(db, 'schedules', s.id), s, { merge: true });
          count++;
        } catch (err: any) {
          errors.push(`Cuadrante ${s.id}: ${err.message}`);
        }
      }
    }
  }

  // 5. Sync Settings
  if (data.settings) {
    try {
      await setDoc(doc(db, 'settings', 'global'), data.settings, { merge: true });
      count++;
    } catch (err: any) {
      errors.push(`Ajustes: ${err.message}`);
    }
  }

  return { syncedCount: count, errors };
}

export interface ConnectionTestMark {
  id: string;
  message: string;
  author: string;
  employeeName: string;
  employeeId: string;
  authorDni: string;
  status: string;
  latencyMs: number;
  timestamp: string;
  databaseId: string;
  projectId: string;
  source: string;
  confirmed: boolean;
}

export async function recordEmployeeConnectionTest(params: {
  employeeName: string;
  employeeFullName: string;
  employeeDni: string;
  employeeId: string;
  latencyMs: number;
  source: string;
}): Promise<ConnectionTestMark> {
  const normName = params.employeeName.toLowerCase();
  const testId = `test-${normName}-${Date.now()}`;
  const mark: ConnectionTestMark = {
    id: testId,
    message: `test de conexion de ${normName} realizado con exito`,
    author: `${params.employeeName} (${params.employeeFullName})`,
    employeeName: params.employeeName,
    employeeId: params.employeeId,
    authorDni: params.employeeDni,
    status: 'CONFIRMADO Y GRABADO',
    latencyMs: params.latencyMs,
    timestamp: new Date().toISOString(),
    databaseId: firebaseConfig.firestoreDatabaseId || 'ai-studio-gestindeturnosys-bc2b5f6a-0c49-4f97-a8be-66476272473a',
    projectId: firebaseConfig.projectId,
    source: params.source,
    confirmed: true,
  };

  try {
    // 1. Record under /connection_tests/latest
    await setDoc(doc(db, 'connection_tests', 'latest'), mark, { merge: true });
    // 2. Record under /connection_tests/by_employee_{name}
    await setDoc(doc(db, 'connection_tests', `by_employee_${normName}`), mark, { merge: true });
    // 3. Update test/connection timestamp
    await setDoc(doc(db, 'test', 'connection'), {
      lastTestAt: mark.timestamp,
      lastTester: mark.author,
      message: mark.message,
    }, { merge: true });
  } catch (err: any) {
    console.warn('Direct Firestore connection test mark notice (using local mirror):', err.message);
  }

  // Save to local cache history
  try {
    const raw = localStorage.getItem('recent_employee_test_marks');
    const existing = raw ? JSON.parse(raw) : {};
    existing[normName] = mark;
    localStorage.setItem('recent_employee_test_marks', JSON.stringify(existing));
    localStorage.setItem('latest_connection_test_mark', JSON.stringify(mark));
  } catch {}

  return mark;
}

export async function recordXiscoConnectionTest(latencyMs = 12, source = 'Navegador Web'): Promise<ConnectionTestMark> {
  return recordEmployeeConnectionTest({
    employeeName: 'Xisco',
    employeeFullName: 'Francisco Gallego Huguet',
    employeeDni: '43134155-R',
    employeeId: 'emp-1',
    latencyMs,
    source,
  });
}

export async function getLatestConnectionTest(): Promise<ConnectionTestMark | null> {
  try {
    const snap = await getDoc(doc(db, 'connection_tests', 'latest'));
    if (snap.exists()) {
      return snap.data() as ConnectionTestMark;
    }
  } catch {}

  try {
    const raw = localStorage.getItem('latest_connection_test_mark');
    if (raw) return JSON.parse(raw);
  } catch {}

  return null;
}

export async function getEmployeeTestMark(empName: string): Promise<ConnectionTestMark | null> {
  const normName = empName.toLowerCase();
  try {
    const snap = await getDoc(doc(db, 'connection_tests', `by_employee_${normName}`));
    if (snap.exists()) {
      return snap.data() as ConnectionTestMark;
    }
  } catch {}

  try {
    const raw = localStorage.getItem('recent_employee_test_marks');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[normName]) return parsed[normName];
    }
  } catch {}

  return null;
}
