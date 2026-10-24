import { doc, getFirestore, onSnapshot, type DocumentData } from 'firebase/firestore';
import { app } from './firebase';
const db = getFirestore(app!);
export function watchStaff(uid: string, receive: (data: DocumentData | null) => void, fail: () => void) {
  return onSnapshot(doc(db, 'staff', uid), snapshot => receive(snapshot.exists() ? snapshot.data() : null), fail);
}
