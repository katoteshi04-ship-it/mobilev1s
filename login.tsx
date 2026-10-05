import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../config/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      console.log(
        "Successfully logged in:",
        userCredential.user.uid
      );

      router.replace("/home");
    } catch (error: any) {
      console.log("Login error:", error);

      let message =
        "Unable to login. Please check your email and password.";

      if (error?.code === "auth/invalid-credential") {
        message = "Invalid email or password.";
      }

      if (error?.code === "auth/user-not-found") {
        message = "No account was found with this email.";
      }

      if (error?.code === "auth/wrong-password") {
        message = "Incorrect password.";
      }

      if (error?.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      }

      Alert.alert("Login Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>B</Text>
          </View>

          <Text style={styles.brandName}>
            BarangayLink
          </Text>

          <Text style={styles.subtitle}>
            RESIDENT PORTAL
          </Text>

          <View style={styles.card}>
            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.description}>
              Login to access your barangay services.
            </Text>

            <Text style={styles.label}>
              Email Address
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              style={styles.input}
            />

            <Pressable
              disabled={loading}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  opacity:
                    loading || pressed ? 0.7 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>
                  Login
                </Text>
              )}
            </Pressable>

            {/* REGISTER */}

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                Don't have an account?
              </Text>

              <Pressable
                onPress={() => router.push("/register")}
              >
                <Text style={styles.registerLink}>
                  Register
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.footer}>
            BarangayLink Resident Portal
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f8f6",
  },

  keyboard: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#087f5b",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  logoText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
  },

  brandName: {
    textAlign: "center",
    marginTop: 14,
    fontSize: 27,
    fontWeight: "900",
    color: "#12372a",
  },

  subtitle: {
    textAlign: "center",
    marginTop: 3,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#6b7280",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    marginTop: 35,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#12372a",
  },

  description: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 25,
    lineHeight: 19,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#12372a",
    marginBottom: 7,
    marginTop: 12,
  },

  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#12372a",
    backgroundColor: "#fafafa",
  },

  loginButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: "#087f5b",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  registerText: {
    fontSize: 12,
    color: "#6b7280",
  },

  registerLink: {
    fontSize: 12,
    fontWeight: "900",
    color: "#087f5b",
    marginLeft: 5,
  },

  footer: {
    textAlign: "center",
    marginTop: 25,
    color: "#9ca3af",
    fontSize: 11,
  },
});