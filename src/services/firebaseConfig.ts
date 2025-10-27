// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 👈 thêm dòng này

const firebaseConfig = {
  apiKey: "AIzaSyDYGnaQ8V-scr5eIQ0YQzSmn4grC2ReVCo",
  authDomain: "bakeryapp-1d0bf.firebaseapp.com",
  projectId: "bakeryapp-1d0bf",
  storageBucket: "bakeryapp-1d0bf.firebasestorage.app",
  messagingSenderId: "525972368111",
  appId: "1:525972368111:web:4229b726d77682c5fb891a",
  measurementId: "G-W6ZQRDRT1X",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firestore
export const db = getFirestore(app);

// 🔥 Khởi tạo Authentication
export const auth = getAuth(app);
