
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * FIREBASE WEB CONFIG
 * Lấy từ Firebase Console > Project Settings
 */
const firebaseConfig = {
  apiKey: "AIzaSyAXVpepkzDADODmscEtAT6UIpHKEG86z5s",
  authDomain: "websitesuoilu-a10fa.firebaseapp.com",
  projectId: "websitesuoilu-a10fa",
  storageBucket: "websitesuoilu-a10fa.firebasestorage.app",
  messagingSenderId: "943432104628",
  appId: "1:943432104628:web:68bbeb271d09678620b5e1",
  measurementId: "G-P68H4H0M1J"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

console.log("Firebase initialized successfully for project:", firebaseConfig.projectId);
