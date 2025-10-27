// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDYGnaQ8V-scr5eIQ0YQzSmn4grC2ReVCo",
  authDomain: "bakeryapp-1d0bf.firebaseapp.com",
  projectId: "bakeryapp-1d0bf",
  storageBucket: "bakeryapp-1d0bf.firebasestorage.app",
  messagingSenderId: "525972368111",
  appId: "1:525972368111:web:4229b726d77682c5fb891a",
  measurementId: "G-W6ZQRDRT1X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore
export const db = getFirestore(app);