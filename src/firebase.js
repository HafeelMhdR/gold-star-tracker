import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxKWsgPFhSsn5wyrpQvf7IuElrCTJvIC8",
  authDomain: "gold-star-tracker-1bd80.firebaseapp.com",
  projectId: "gold-star-tracker-1bd80",
  storageBucket: "gold-star-tracker-1bd80.firebasestorage.app",
  messagingSenderId: "470577755721",
  appId: "1:470577755721:web:301fd5b7cb5490e1063198",
  measurementId: "G-XZ9B7L5TZ8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
