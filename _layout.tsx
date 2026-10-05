import { router, Stack, useSegments } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { auth } from "../firebase/config";

export default function RootLayout() {
  const segments = useSegments();

  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (checkingAuth) return;

    const inAuthGroup =
      segments[0] === "login" ||
      segments[0] === "register";

    if (!user && !inAuthGroup) {
      router.replace("/login");
      return;
    }

    if (user && inAuthGroup) {
      router.replace("/home");
    }
  }, [user, checkingAuth, segments]);

  if (checkingAuth) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f8f6",
        }}
      >
        <ActivityIndicator
          size="large"
          color="#087f5b"
        />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}