// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBO1QITelhIzyFze8hmdwkw-bbcBg21av8",
  authDomain: "expensesplitter-50167.firebaseapp.com",
  projectId: "expensesplitter-50167",
  storageBucket: "expensesplitter-50167.firebasestorage.app",
  messagingSenderId: "684423658317",
  appId: "1:684423658317:web:3df5389599ec4018e0d504",
  measurementId: "G-JQYEWX4W5H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
