import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDV-xp4hA8PwtX3aKuVu1JsDnLcUREmI6g',
  authDomain: 'bloodconnect-mobile-app.firebaseapp.com',
  projectId: 'bloodconnect-mobile-app',
  storageBucket: 'bloodconnect-mobile-app.firebasestorage.app',
  messagingSenderId: '913525251762',
  appId: '1:913525251762:web:5f94874cbcf2725607b3ab',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;