import { connectFirestoreEmulator, doc, getFirestore, onSnapshot, type DocumentData } from 'firebase/firestore';
import { app } from './firebase';
const db = getFirestore(app!);
if (import.meta.env.VITE_USE_EMULATORS === 'true') connectFirestoreEmulator(db, '127.0.0.1', 8080);
export function watchStaff(uid: string, receive: (data: DocumentData | null) => void, fail: () => void) {
  return onSnapshot(doc(db, 'staff', uid), snapshot => receive(snapshot.exists() ? snapshot.data() : null), fail);
}
