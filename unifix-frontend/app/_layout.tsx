import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Animated,
  BackHandler,
  InteractionManager,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { AdminDashboardSkeleton, DashboardSkeleton, StaffDashboardSkeleton } from "../components/skeleton";
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

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#16a34a",
    sound: "default",
  });
}

const EXIT_ROUTES = ["/", "/(student)/index", "/(staff)/staff-dashboard", "/(admin)/admin-dashboard"];

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
    return tokenData.data;
  } catch (e) {
    console.error("[Push] Registration error:", e);
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
    console.log("[Push] Save token response:", data);
  } catch (e) {
    console.error("[Push] Save token error:", e);
  }
}

function UnifixSplash() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, []);

return (
    <View style={splashStyles.container}>
      <Animated.Image
        source={require("../assets/1.png")}
        style={[splashStyles.logo, { opacity }]}
        resizeMode="contain"
      />
      <View style={splashStyles.footer}>
        <Animated.Text style={[splashStyles.from, { opacity }]}>from</Animated.Text>
        <Animated.Text style={[splashStyles.name, { opacity }]}>VCET</Animated.Text>
      </View>
    </View>
  );
}
const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
  backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
logo: {
    width: 180,
    height: 180,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
    gap: 2,
  },
  from: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16a34a",
    letterSpacing: 2,
  },
});

export default function RootLayout() {
  const router = useRouter();
const [appReady, setAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [cachedRole, setCachedRole] = useState<string | null>(null);
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
    let authUnsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        const cachedUserStr = await AsyncStorage.getItem("unifix_cached_user");
        const cachedUser = cachedUserStr ? JSON.parse(cachedUserStr) : null;

  if (
          cachedUser &&
          cachedUser.uid &&
          cachedUser.role &&
          cachedUser.route
        ) {
          currentRouteRef.current = cachedUser.route;
          setInitialRoute(cachedUser.route);
          setCachedRole(cachedUser.role);
          setAppReady(true);
        }

       authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          // ── BACKGROUND VERIFICATION ONLY ──
          // If we already routed from cache, don't block UI — just verify silently
          const alreadyRouted = !!currentRouteRef.current;

          try {
            if (!firebaseUser) {
              await AsyncStorage.removeItem("unifix_cached_user");
              // Only redirect if we haven't already gone somewhere
              if (!alreadyRouted) {
                currentRouteRef.current = "/login";
                setInitialRoute("/login");
                setAppReady(true);
              } else {
                // Was cached but Firebase says logged out — kick to login
                router.replace("/login" as any);
              }
              return;
            }

            // Don't force-refresh token on every open — only when cache is old
            const cachedStr = await AsyncStorage.getItem("unifix_cached_user");
            const cached = cachedStr ? JSON.parse(cachedStr) : null;
            const cacheAgeMs = cached?.cachedAt ? Date.now() - cached.cachedAt : Infinity;
            const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

            // Skip Firestore fetch if cache is fresh
            if (alreadyRouted && cacheAgeMs < CACHE_TTL) {
              // Cache is fresh — just register push token silently, don't touch UI
              const pushToken = await registerForPushNotifications();
              if (pushToken) savePushTokenToServer(pushToken); // fire and forget
              return;
            }

            // Cache is stale or first open — do full verification in background
            let idToken;
            try {
              idToken = await firebaseUser.getIdToken(); // no force-refresh
            } catch (tokenError) {
              console.log("Token refresh failed, using cached session");
              if (!alreadyRouted) {
                currentRouteRef.current = "/login";
                setInitialRoute("/login");
                setAppReady(true);
              }
              return;
            }

            const snap = await getDoc(doc(db, "users", firebaseUser.uid));

            if (!snap.exists() || !snap.data()?.profileCompleted) {
              await AsyncStorage.removeItem("unifix_cached_user");
              const target = "/complete-profile";
              if (!alreadyRouted) {
                currentRouteRef.current = target;
                setInitialRoute(target);
                setAppReady(true);
              } else {
                router.replace(target as any);
              }
              return;
            }

            const { role, verificationStatus } = snap.data();

            if (role === "staff" && verificationStatus !== "approved") {
              await AsyncStorage.removeItem("unifix_cached_user");
              const target = "/complete-profile";
              if (!alreadyRouted) {
                currentRouteRef.current = target;
                setInitialRoute(target);
                setAppReady(true);
              } else {
                router.replace(target as any);
              }
              return;
            }

            const route =
              role === "admin"
                ? "/admin-dashboard"
                : role === "staff" && verificationStatus === "approved"
                  ? "/staff-dashboard"
                  : "/";

            // Update cache with fresh timestamp
            await AsyncStorage.setItem(
              "unifix_cached_user",
              JSON.stringify({
                uid: firebaseUser.uid,
                role,
                route,
                cachedAt: Date.now(),
              }),
            );

            if (!alreadyRouted) {
              currentRouteRef.current = route;
              setInitialRoute(route);
              setAppReady(true);
            } else if (route !== currentRouteRef.current) {
              // Role changed (e.g. staff got approved) — redirect silently
              router.replace(route as any);
            }

            const pushToken = await registerForPushNotifications();
            if (pushToken) savePushTokenToServer(pushToken); // fire and forget
          } catch (err) {
            console.log("Firebase auth error:", err);
            if (!alreadyRouted) {
              currentRouteRef.current = "/login";
              setInitialRoute("/login");
              setAppReady(true);
            }
          }
        });
      } catch (err) {
        currentRouteRef.current = "/login";
        setInitialRoute("/login");
        setAppReady(true);
      }
    };

    initAuth();

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
              } else if (data.type === "new_lost_found") {
                router.push({
                  pathname: "/staff-dashboard",
                  params: { openTab: "lostfound", openLFTab: "feed" },
                } as any);
              } else if (data.type === "item_handed_over") {
                router.push({
                  pathname: "/staff-dashboard",
                  params: { openTab: "lostfound", openLFTab: "claims" },
                } as any);
              } else {
                router.push("/staff-dashboard" as any);
              }
            } else if (role === "admin") {
              router.push("/admin-dashboard" as any);
            } else {
              if (
                data.type === "complaint_completed" ||
                data.type === "complaint_accepted" ||
                data.type === "complaint_in_progress" ||
                data.type === "complaint_rejected" ||
                data.type === "complaint_escalated" ||
                data.complaintId
              ) {
                router.push({
                  pathname: "/",
                  params: {
                    openTab: "complaints",
                    openComplaintId: data.complaintId || null,
                  },
                } as any);
              } else if (
                data.type === "new_lost_found" ||
                data.type === "item_handed_over" ||
                data.type === "new_lost_report" ||
                data.type === "lost_report_found"
              ) {
                const lfTab =
                  data.type === "new_lost_found"
                    ? "feed"
                    : data.type === "item_handed_over"
                      ? "claims"
                      : data.type === "new_lost_report"
                        ? "lostreports"
                        : "lost-history";
                router.push({
                  pathname: "/",
                  params: { openTab: "lostfound", openLFTab: lfTab },
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
      if (authUnsubscribe) authUnsubscribe();
      if (notificationListener.current) notificationListener.current.remove();
      if (responseListener.current) responseListener.current.remove();
    };
  }, []);

useEffect(() => {
   setTimeout(() => setMinSplashDone(true), 500);
  }, []);

  useEffect(() => {
    if (appReady && initialRoute && minSplashDone) {
      InteractionManager.runAfterInteractions(() => {
        router.replace(initialRoute as any);
      });
    }
  }, [appReady, initialRoute, minSplashDone]);

const [skeletonVisible, setSkeletonVisible] = useState(true);
  const skeletonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (appReady && minSplashDone) {
      // Give the navigated screen ~400ms to mount, then fade out overlay
      const timer = setTimeout(() => {
        Animated.timing(skeletonAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setSkeletonVisible(false));
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [appReady, minSplashDone]);

  function getRoleSkeletonOrSplash() {
    if (cachedRole === "staff") return <StaffDashboardSkeleton />;
    if (cachedRole === "admin") return <AdminDashboardSkeleton />;
    if (cachedRole === "student" || cachedRole === "teacher") return <DashboardSkeleton />;
    return <UnifixSplash />;
  }

  if (!appReady || !minSplashDone) {
    return getRoleSkeletonOrSplash();
  }

  return (
    <>
<Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(student)/index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(auth)/otp-verification" />
        <Stack.Screen name="(auth)/reset-password" />
        <Stack.Screen name="(auth)/complete-profile" />
        <Stack.Screen name="(student)/submit-complaint" />
        <Stack.Screen name="(student)/complaint-success" />
        <Stack.Screen name="(student)/my-complaints" />
        <Stack.Screen name="(staff)/staff-dashboard" />
        <Stack.Screen name="(student)/report-ragging" />
        <Stack.Screen name="(admin)/admin-dashboard" />
        <Stack.Screen name="legal/terms-and-conditions" options={{ headerShown: false }} />
        <Stack.Screen name="(student)/modal" options={{ presentation: "modal" }} />
      </Stack>
<Toast />
      {skeletonVisible && cachedRole && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: skeletonAnim, zIndex: 999, backgroundColor: "white" },
          ]}
        >
          {getRoleSkeletonOrSplash()}
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 60,
    paddingTop: 0,
  },
  splashCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  vcetContainer: {
    alignItems: "center",
    gap: 4,
  },
  vcetFrom: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "400",
  },
  vcetText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16a34a",
    letterSpacing: 2,
  },
});
