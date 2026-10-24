import {connectFirestoreEmulator,getFirestore} from 'firebase/firestore';
import {app} from './firebase';
export function connectLocalFirestore(){
 if(!app)throw Error('Local Firebase configuration is missing.');
 connectFirestoreEmulator(getFirestore(app),'127.0.0.1',8080);
}
