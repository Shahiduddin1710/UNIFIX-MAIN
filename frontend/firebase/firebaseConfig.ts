import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAGyW1xLnu1OXfXQdckEuTQ5M3Oahop4h8",
  authDomain: "unifix-ac990.firebaseapp.com",
  projectId: "unifix-ac990",
  storageBucket: "unifix-ac990.firebasestorage.app",
  messagingSenderId: "855341107379",
  appId: "1:855341107379:web:49e604efd43fa93d5188c6",
};


const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage as any),
});

export const db = getFirestore(app);
export { app };