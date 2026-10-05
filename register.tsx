
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
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

import { auth, db } from "../firebase/config";

export default function RegisterScreen() {
  // ==========================================
  // FORM STATES
  // ==========================================

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [occupation, setOccupation] = useState("");

  const [address, setAddress] = useState("");
  const [purok, setPurok] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async () => {
    // Remove spaces
    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanContact = contactNumber.trim();
    const cleanBirthDate = birthDate.trim();
    const cleanGender = gender.trim();
    const cleanCivilStatus = civilStatus.trim();
    const cleanOccupation = occupation.trim();
    const cleanAddress = address.trim();
    const cleanPurok = purok.trim();

    // ==========================================
    // VALIDATION
    // ==========================================

    if (
      !cleanFullName ||
      !cleanEmail ||
      !cleanContact ||
      !cleanBirthDate ||
      !cleanGender ||
      !cleanCivilStatus ||
      !cleanOccupation ||
      !cleanAddress ||
      !cleanPurok ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert(
        "Missing Information",
        "Please complete all fields before creating your account."
      );

      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Passwords do not match."
      );

      return;
    }

    // ==========================================
    // START REGISTER
    // ==========================================

    try {
      setLoading(true);

      // Create Firebase Authentication account
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      const user = userCredential.user;

      // ==========================================
      // SAVE RESIDENT PROFILE
      // ==========================================

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,

          // PERSONAL INFORMATION
          fullName: cleanFullName,
          birthDate: cleanBirthDate,
          gender: cleanGender,
          civilStatus: cleanCivilStatus,
          occupation: cleanOccupation,

          // CONTACT INFORMATION
          email: cleanEmail,
          contactNumber: cleanContact,

          // ADDRESS
          address: cleanAddress,
          purok: cleanPurok,
          location: "Sasmuan, Pampanga",

          // ACCOUNT
          role: "resident",
          status: "active",

          // DATE REGISTERED
          createdAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      // ==========================================
      // SIGN OUT AFTER REGISTER
      // ==========================================

      await signOut(auth);

      Alert.alert(
        "Registration Successful",
        "Your BarangayLink account has been created successfully.",
        [
          {
            text: "Go to Login",
            onPress: () => {
              router.replace("/login");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Registration error:", error);

      let message =
        "Unable to create your account. Please try again.";

      // Firebase errors
      if (
        error &&
        typeof error === "object" &&
        "code" in error
      ) {
        const firebaseError = error;

        if (
          firebaseError.code ===
          "auth/email-already-in-use"
        ) {
          message =
            "This email address is already registered.";
        } else if (
          firebaseError.code ===
          "auth/invalid-email"
        ) {
          message =
            "Please enter a valid email address.";
        } else if (
          firebaseError.code ===
          "auth/weak-password"
        ) {
          message =
            "Password is too weak. Use at least 6 characters.";
        } else if (
          firebaseError.code ===
          "auth/network-request-failed"
        ) {
          message =
            "Network error. Please check your internet connection.";
        }
      }

      Alert.alert(
        "Registration Failed",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <KeyboardAvoidingView
      style={styles.flex}
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
        {/* =====================================
            BRAND
        ====================================== */}

        <View style={styles.brandSection}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>B</Text>
          </View>

          <Text style={styles.brandName}>
            BarangayLink
          </Text>

          <Text style={styles.brandSubtitle}>
            SASMUAN RESIDENT PORTAL
          </Text>
        </View>

        {/* =====================================
            REGISTER CARD
        ====================================== */}

        <View style={styles.card}>
          <Text style={styles.title}>
            Create Account
          </Text>

          <Text style={styles.description}>
            Register your account and resident
            information for BarangayLink services.
          </Text>

          {/* =====================================
              PERSONAL INFORMATION
          ====================================== */}

          <Text style={styles.sectionTitle}>
            PERSONAL INFORMATION
          </Text>

          {/* FULL NAME */}

          <Text style={styles.label}>
            Full Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
          />

          {/* BIRTH DATE */}

          <Text style={styles.label}>
            Date of Birth
          </Text>

          <TextInput
            style={styles.input}
            placeholder="MM/DD/YYYY"
            placeholderTextColor="#9ca3af"
            value={birthDate}
            onChangeText={setBirthDate}
            keyboardType="numbers-and-punctuation"
            editable={!loading}
          />

          {/* GENDER */}

          <Text style={styles.label}>
            Gender
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Male / Female / Other"
            placeholderTextColor="#9ca3af"
            value={gender}
            onChangeText={setGender}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* CIVIL STATUS */}

          <Text style={styles.label}>
            Civil Status
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Single / Married / Widowed / Separated"
            placeholderTextColor="#9ca3af"
            value={civilStatus}
            onChangeText={setCivilStatus}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* OCCUPATION */}

          <Text style={styles.label}>
            Occupation
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your occupation"
            placeholderTextColor="#9ca3af"
            value={occupation}
            onChangeText={setOccupation}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* =====================================
              CONTACT INFORMATION
          ====================================== */}

          <Text style={styles.sectionTitle}>
            CONTACT INFORMATION
          </Text>

          {/* CONTACT */}

          <Text style={styles.label}>
            Contact Number
          </Text>

          <TextInput
            style={styles.input}
            placeholder="09XXXXXXXXX"
            placeholderTextColor="#9ca3af"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            editable={!loading}
          />

          {/* EMAIL */}

          <Text style={styles.label}>
            Email Address
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!loading}
          />

          {/* =====================================
              ADDRESS
          ====================================== */}

          <Text style={styles.sectionTitle}>
            RESIDENTIAL ADDRESS
          </Text>

          {/* COMPLETE ADDRESS */}

          <Text style={styles.label}>
            Complete Address
          </Text>

          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
            ]}
            placeholder="House No., Street, Barangay"
            placeholderTextColor="#9ca3af"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!loading}
          />

          {/* PUROK */}

          <Text style={styles.label}>
            Purok
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Example: Purok 3"
            placeholderTextColor="#9ca3af"
            value={purok}
            onChangeText={setPurok}
            autoCapitalize="words"
            editable={!loading}
          />

          {/* =====================================
              ACCOUNT SECURITY
          ====================================== */}

          <Text style={styles.sectionTitle}>
            ACCOUNT SECURITY
          </Text>

          {/* PASSWORD */}

          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* CONFIRM PASSWORD */}

          <Text style={styles.label}>
            Confirm Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#9ca3af"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {/* =====================================
              REGISTER BUTTON
          ====================================== */}

          <Pressable
            style={[
              styles.registerButton,
              loading &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                style={styles.registerButtonText}
              >
                Create Account
              </Text>
            )}
          </Pressable>

          {/* LOGIN */}

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <Pressable
              onPress={() =>
                router.replace("/login")
              }
              disabled={loading}
            >
              <Text style={styles.loginLink}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>

        {/* =====================================
            LOCATION
        ====================================== */}

        <View style={styles.locationSection}>
          <View style={styles.locationDot} />

          <View>
            <Text style={styles.locationTitle}>
              Sasmuan
            </Text>

            <Text style={styles.locationText}>
              Pampanga, Philippines
            </Text>
          </View>
        </View>

        <Text style={styles.footer}>
          © 2026 BarangayLink
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#f5f8f6",
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 30,
  },

  // BRAND

  brandSection: {
    alignItems: "center",
    marginBottom: 25,
  },

  logo: {
    width: 65,
    height: 65,
    borderRadius: 19,
    backgroundColor: "#087f5b",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },

  logoText: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
  },

  brandName: {
    fontSize: 28,
    fontWeight: "900",
    color: "#12372a",
  },

  brandSubtitle: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#6b7280",
    marginTop: 3,
  },

  // CARD

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 23,
    borderWidth: 1,
    borderColor: "#e5e7eb",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#12372a",
  },

  description: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6b7280",
    marginTop: 6,
    marginBottom: 21,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    color: "#087f5b",
    marginTop: 12,
    marginBottom: 13,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  input: {
    minHeight: 51,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    backgroundColor: "#fafafa",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    marginBottom: 15,
  },

  multilineInput: {
    minHeight: 85,
    paddingTop: 14,
    paddingBottom: 14,
  },

  // REGISTER BUTTON

  registerButton: {
    height: 53,
    borderRadius: 13,
    backgroundColor: "#087f5b",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  registerButtonDisabled: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  // LOGIN

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 21,
  },

  loginText: {
    fontSize: 13,
    color: "#6b7280",
  },

  loginLink: {
    fontSize: 13,
    fontWeight: "800",
    color: "#087f5b",
    marginLeft: 5,
  },

  // LOCATION

  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },

  locationDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#087f5b",
    marginRight: 8,
  },

  locationTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#374151",
  },

  locationText: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 1,
  },

  footer: {
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 18,
  } 
})
