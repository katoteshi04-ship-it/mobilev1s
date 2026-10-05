import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
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

import { auth, db } from "../config/firebase";

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Personal Information
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");

  // Address
  const [address, setAddress] = useState("");
  const [barangay, setBarangay] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          router.replace("/login");
          return;
        }

        try {
          const userRef = doc(
            db,
            "users",
            user.uid
          );

          const userSnapshot = await getDoc(
            userRef
          );

          if (userSnapshot.exists()) {
            const data = userSnapshot.data();

            setFullName(
              data.fullName ||
                data.name ||
                user.displayName ||
                ""
            );

            setEmail(
              data.email ||
                user.email ||
                ""
            );

            setPhone(data.phone || "");
            setBirthDate(data.birthDate || "");
            setGender(data.gender || "");

            setAddress(data.address || "");
            setBarangay(data.barangay || "");
            setCity(data.city || "");
            setProvince(data.province || "");
          } else {
            setFullName(
              user.displayName || ""
            );

            setEmail(user.email || "");
          }
        } catch (error) {
          console.log(
            "Error loading profile:",
            error
          );

          Alert.alert(
            "Error",
            "Unable to load your profile."
          );
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;

    if (!user) {
      router.replace("/login");
      return;
    }

    // Validate fields
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !birthDate.trim() ||
      !gender.trim() ||
      !address.trim() ||
      !barangay.trim() ||
      !city.trim() ||
      !province.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please complete all personal information and address fields."
      );
      return;
    }

    try {
      setSaving(true);

      const userRef = doc(
        db,
        "users",
        user.uid
      );

      // Save updated information
      await setDoc(
        userRef,
        {
          uid: user.uid,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          birthDate: birthDate.trim(),
          gender: gender.trim(),
          address: address.trim(),
          barangay: barangay.trim(),
          city: city.trim(),
          province: province.trim(),
          updatedAt: serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      // Update Firebase Authentication display name
      if (
        user.displayName !==
        fullName.trim()
      ) {
        const { updateProfile } =
          await import("firebase/auth");

        await updateProfile(user, {
          displayName: fullName.trim(),
        });
      }

      Alert.alert(
        "Profile Updated",
        "Your personal information has been updated successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/profile");
            },
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "Error updating profile:",
        error
      );

      Alert.alert(
        "Update Failed",
        "Unable to update your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#087f5b"
          />

          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          contentContainerStyle={
            styles.container
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                {
                  opacity: pressed
                    ? 0.7
                    : 1,
                },
              ]}
            >
              <Text style={styles.backText}>
                ‹
              </Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              Edit Profile
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* INTRO */}

          <View style={styles.intro}>
            <Text style={styles.title}>
              Personal Information
            </Text>

            <Text style={styles.description}>
              Update your personal information
              and address details below.
            </Text>
          </View>

          {/* PERSONAL DETAILS */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Personal Details
            </Text>

            {/* FULL NAME */}

            <Text style={styles.label}>
              Full Name
            </Text>

            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoCorrect={false}
              style={styles.input}
            />

            {/* EMAIL */}

            <Text style={styles.label}>
              Email
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

            {/* PHONE */}

            <Text style={styles.label}>
              Phone Number
            </Text>

            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="09XXXXXXXXX"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              style={styles.input}
            />

            {/* BIRTH DATE */}

            <Text style={styles.label}>
              Birth Date
            </Text>

            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="#9ca3af"
              keyboardType="numbers-and-punctuation"
              style={styles.input}
            />

            {/* GENDER */}

            <Text style={styles.label}>
              Gender
            </Text>

            <TextInput
              value={gender}
              onChangeText={setGender}
              placeholder="Male / Female / Other"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          {/* ADDRESS */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Address
            </Text>

            {/* ADDRESS */}

            <Text style={styles.label}>
              Address
            </Text>

            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="House No., Street, Sitio/Purok"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              style={styles.input}
            />

            {/* BARANGAY */}

            <Text style={styles.label}>
              Barangay
            </Text>

            <TextInput
              value={barangay}
              onChangeText={setBarangay}
              placeholder="Enter your barangay"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              style={styles.input}
            />

            {/* CITY / MUNICIPALITY */}

            <Text style={styles.label}>
              City / Municipality
            </Text>

            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Enter city or municipality"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              style={styles.input}
            />

            {/* PROVINCE */}

            <Text style={styles.label}>
              Province
            </Text>

            <TextInput
              value={province}
              onChangeText={setProvince}
              placeholder="Enter your province"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          {/* SAVE BUTTON */}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              {
                opacity:
                  saving || pressed
                    ? 0.7
                    : 1,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator
                color="#ffffff"
              />
            ) : (
              <Text
                style={
                  styles.saveButtonText
                }
              >
                Save Changes
              </Text>
            )}
          </Pressable>

          {/* CANCEL BUTTON */}

          <Pressable
            disabled={saving}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.cancelButton,
              {
                opacity: pressed
                  ? 0.7
                  : 1,
              },
            ]}
          >
            <Text
              style={styles.cancelButtonText}
            >
              Cancel
            </Text>
          </Pressable>

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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: "#6b7280",
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: "#12372a",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#12372a",
  },

  headerSpacer: {
    width: 42,
  },

  /* INTRO */

  intro: {
    marginBottom: 20,
  },

  title: {
    fontSize: 27,
    fontWeight: "900",
    color: "#12372a",
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6b7280",
    marginTop: 7,
  },

  /* CARD */

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  /* SECTION */

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#12372a",
    marginBottom: 8,
  },

  /* LABEL */

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#12372a",
    marginTop: 15,
    marginBottom: 7,
  },

  /* INPUT */

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

  /* SAVE */

  saveButton: {
    height: 52,
    borderRadius: 13,
    backgroundColor: "#087f5b",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },

  /* CANCEL */

  cancelButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },

  cancelButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "800",
  },

  /* FOOTER */

  footer: {
    textAlign: "center",
    marginTop: 22,
    color: "#9ca3af",
    fontSize: 11,
  },
});
