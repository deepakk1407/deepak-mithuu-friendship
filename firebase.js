
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4WwQoQn3CeTUNUrdN41bVv5F9HPohVdg",
  authDomain: "deepak-mithuu-friendship.firebaseapp.com",
  projectId: "deepak-mithuu-friendship",
  storageBucket: "deepak-mithuu-friendship.firebasestorage.app",
  messagingSenderId: "818475210566",
  appId: "1:818475210566:web:1ce05d5262718154edf747",
  measurementId: "G-M6ZSSV9ELW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
