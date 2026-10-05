import { Redirect } from "expo-router";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { subscribeToAuth } from "../firebase/auth";

export default function Index() {
  const [user, setUser] =
    useState<User | null>(null);

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    const unsubscribe =
      subscribeToAuth((currentUser) => {
        setUser(currentUser);
        setChecking(false);
      });

    return unsubscribe;
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#087f5b"
        />

        <Text style={styles.loadingText}>
          Loading BarangayLink...
        </Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f8f6",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
});
