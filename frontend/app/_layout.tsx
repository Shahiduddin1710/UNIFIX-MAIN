import { useEffect, useState, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#16a34a",
        sound: "default",
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch {
    return null;
  }
}

async function savePushTokenToServer(token: string) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
    await fetch(`${BASE_URL}/auth/save-push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ expoPushToken: token }),
    });
  } catch {}
}

export default function RootLayout() {
  const router = useRouter();
  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setInitialRoute("/login");
          setAppReady(true);
          return;
        }
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (!snap.exists() || !snap.data()?.profileCompleted) {
          setInitialRoute("/complete-profile");
          setAppReady(true);
          return;
        }
        const { role, verificationStatus } = snap.data();
        if (role === "staff" && verificationStatus !== "approved") {
          setInitialRoute("/complete-profile");
          setAppReady(true);
          return;
        }

        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await savePushTokenToServer(pushToken);
        }

        if (role === "staff" && verificationStatus === "approved") {
          setInitialRoute("/staff-dashboard");
          setAppReady(true);
          return;
        }
        setInitialRoute("/");
        setAppReady(true);
      } catch {
        setInitialRoute("/login");
        setAppReady(true);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

 
responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
  const data = response.notification.request.content.data as any;
  if (!data) return;
  const user = auth.currentUser;
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) return;
    const { role, verificationStatus } = snap.data();
    if (role === "staff" && verificationStatus === "approved") {
      if (data.complaintId) {
        router.push({ pathname: "/staff-dashboard", params: { openComplaintId: data.complaintId } } as any);
      } else if (data.itemId) {
        router.push({ pathname: "/staff-dashboard", params: { openTab: "lostfound" } } as any);
      } else {
        router.push("/staff-dashboard" as any);
      }
    } else {
      if (data.complaintId) {
        router.push({ pathname: "/", params: { openComplaintId: data.complaintId } } as any);
      } else if (data.itemId) {
        router.push({ pathname: "/", params: { openTab: "lostfound" } } as any);
      } else {
        router.push("/" as any);
      }
    }
  } catch {
    router.push("/" as any);
  }
});

    return () => {
      unsubscribe();
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

  useEffect(() => {
    if (appReady && initialRoute) {
      router.replace(initialRoute as any);
    }
  }, [appReady, initialRoute]);

  if (!appReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp-verification" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="complete-profile" />
      <Stack.Screen name="submit-complaint" />
      <Stack.Screen name="complaint-success" />
      <Stack.Screen name="my-complaints" />
      <Stack.Screen name="staff-dashboard" />
      <Stack.Screen name="lost-and-found" />
      <Stack.Screen name="post-found-item" />
      <Stack.Screen name="terms-and-conditions" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center" },
});