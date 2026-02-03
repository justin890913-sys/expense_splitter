import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBO1QITelhIzyFze8hmdwkw-bbcBg21av8",
  authDomain: "expensesplitter-50167.firebaseapp.com",
  projectId: "expensesplitter-50167",
  storageBucket: "expensesplitter-50167.firebasestorage.app",
  messagingSenderId: "684423658317",
  appId: "1:684423658317:web:3df5389599ec4018e0d504",
  measurementId: "G-JQYEWX4W5H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
