import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCpeSP-iH0DZg4iwVCF1SwFq0n8FabAGzM",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "web-nang-cao-7cd8c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "web-nang-cao-7cd8c",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "web-nang-cao-7cd8c.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1042444670734",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:1042444670734:web:92fc78bb88f43b73a7a95f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-9L4D48L3X0",
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

facebookProvider.addScope("email");
