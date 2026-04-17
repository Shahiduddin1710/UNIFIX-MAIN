import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { auth, db } from "../firebase/firebaseConfig";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#16a34a",
    sound: "default",
  });
}

const EXIT_ROUTES = ["/", "/staff-dashboard"];

async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
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

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.warn("[Push] No projectId found in config");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("[Push] Token received:", tokenData.data); // ← ADD THIS
    return tokenData.data;
  } catch (e) {
    console.error("[Push] Registration error:", e); // ← ADD THIS
    return null;
  }
}

async function savePushTokenToServer(token: string) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
    const res = await fetch(`${BASE_URL}/auth/save-push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ expoPushToken: token }),
    });
    const data = await res.json();
    console.log("[Push] Save token response:", data); // ← ADD THIS
  } catch (e) {
    console.error("[Push] Save token error:", e); // ← ADD THIS
  }
}

export default function RootLayout() {
  const router = useRouter();
  const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const currentRouteRef = useRef<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null,
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (initialRoute) currentRouteRef.current = initialRoute;
  }, [initialRoute]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const onBackPress = () => {
      const route = currentRouteRef.current;
      if (route && EXIT_ROUTES.includes(route)) {
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            { text: "Cancel", style: "cancel", onPress: () => {} },
            {
              text: "OK",
              style: "destructive",
              onPress: () => BackHandler.exitApp(),
            },
          ],
          { cancelable: true },
        );
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          currentRouteRef.current = "/login";
          setInitialRoute("/login");
          setAppReady(true);
          return;
        }

        await firebaseUser.getIdToken(true);
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));

        if (!snap.exists() || !snap.data()?.profileCompleted) {
          currentRouteRef.current = "/complete-profile";
          setInitialRoute("/complete-profile");
          setAppReady(true);
          return;
        }

        const { role, verificationStatus } = snap.data();

        if (role === "staff" && verificationStatus !== "approved") {
          currentRouteRef.current = "/complete-profile";
          setInitialRoute("/complete-profile");
          setAppReady(true);
          return;
        }

        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          await savePushTokenToServer(pushToken);
        }

        const route =
          role === "staff" && verificationStatus === "approved"
            ? "/staff-dashboard"
            : "/";

        currentRouteRef.current = route;
        setInitialRoute(route);
        setAppReady(true);
      } catch {
        currentRouteRef.current = "/login";
        setInitialRoute("/login");
        setAppReady(true);
      }
    });

    notificationListener.current =
      Notifications.addNotificationReceivedListener(() => {});

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        async (response) => {
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
                router.push({
                  pathname: "/staff-dashboard",
                  params: { openComplaintId: data.complaintId },
                } as any);
              } else if (data.itemId) {
                router.push({
                  pathname: "/staff-dashboard",
                  params: { openTab: "lostfound" },
                } as any);
              } else {
                router.push("/staff-dashboard" as any);
              }
            } else {
              if (data.complaintId) {
                router.push({
                  pathname: "/",
                  params: { openComplaintId: data.complaintId },
                } as any);
              } else if (data.itemId) {
                router.push({
                  pathname: "/",
                  params: { openTab: "lostfound" },
                } as any);
              } else {
                router.push("/" as any);
              }
            }
          } catch {
            router.push("/" as any);
          }
        },
      );

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
      <Stack.Screen
        name="terms-and-conditions"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
});
