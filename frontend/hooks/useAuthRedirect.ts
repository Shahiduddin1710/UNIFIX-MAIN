import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

type AuthState = {
  ready: boolean;
  uid: string | null;
  role: string | null;
};

export function useAuthRedirect(): AuthState {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    ready: false,
    uid: null,
    role: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          router.replace("/login");
          setState({ ready: true, uid: null, role: null });
          return;
        }

        const snap = await getDoc(doc(db, "users", firebaseUser.uid));

        if (!snap.exists() || !snap.data()?.profileCompleted) {
          router.replace("/complete-profile");
          setState({ ready: true, uid: firebaseUser.uid, role: null });
          return;
        }

        const { role, verificationStatus } = snap.data();

        if (role === "staff" && verificationStatus !== "approved") {
          router.replace("/complete-profile");
          setState({ ready: true, uid: firebaseUser.uid, role });
          return;
        }

        if (role === "staff" && verificationStatus === "approved") {
          router.replace("/staff-dashboard");
          setState({ ready: true, uid: firebaseUser.uid, role });
          return;
        }

        router.replace("/");
        setState({ ready: true, uid: firebaseUser.uid, role });
      } catch {
        router.replace("/login");
        setState({ ready: true, uid: null, role: null });
      }
    });

    return () => unsub();
  }, []);

  return state;
}