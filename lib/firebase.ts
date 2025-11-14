// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXo1aQC8UqVlWh8cUEpdgfh7BX_JEBW_w",
  authDomain: "mentormatch-ba0d1.firebaseapp.com",
  projectId: "mentormatch-ba0d1",
  storageBucket: "mentormatch-ba0d1.firebasestorage.app",
  messagingSenderId: "711185004120",
  appId: "1:711185004120:web:a83fd1189dfd898a8fbc2d",
  measurementId: "G-9P9WW5P888"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);