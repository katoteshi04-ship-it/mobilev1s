import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
    doc,
    getDoc,
} from "firebase/firestore";

import {
    onAuthStateChanged,
} from "firebase/auth";

import { auth, db } from "../config/firebase";

type UserData = {
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  birthDate?: string;
  gender?: string;
};

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        if (userSnapshot.exists()) {
          const data = userSnapshot.data();

          setUserData({
            ...data,
            email: data.email || user.email || "",
          });
        } else {
          // Kung walang document sa Firestore,
          // gamitin ang Firebase Authentication data.
          setUserData({
            fullName: user.displayName || "Resident",
            email: user.email || "",
          });
        }
      } catch (error) {
        console.log("Error loading profile:", error);

        setUserData({
          fullName: user.displayName || "Resident",
          email: user.email || "",
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

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

  const displayName =
    userData?.fullName ||
    userData?.name ||
    "Resident";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            My Profile
          </Text>

          <View style={{ width: 42 }} />
        </View>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              👤
            </Text>
          </View>

          <Text style={styles.name}>
            {displayName}
          </Text>

          <Text style={styles.email}>
            {userData?.email || "No email"}
          </Text>
        </View>

        {/* PERSONAL INFORMATION */}

        <Text style={styles.sectionTitle}>
          Personal Information
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            label="Full Name"
            value={displayName}
          />

          <InfoRow
            label="Email"
            value={userData?.email}
          />

          <InfoRow
            label="Phone Number"
            value={userData?.phone}
          />

          <InfoRow
            label="Birth Date"
            value={userData?.birthDate}
          />

          <InfoRow
            label="Gender"
            value={userData?.gender}
          />
        </View>

        {/* ADDRESS */}

        <Text style={styles.sectionTitle}>
          Address
        </Text>

        <View style={styles.infoCard}>
          <InfoRow
            label="Address"
            value={userData?.address}
          />

          <InfoRow
            label="Barangay"
            value={userData?.barangay || "Sasmuan"}
          />

          <InfoRow
            label="City / Municipality"
            value={userData?.city}
          />

          <InfoRow
            label="Province"
            value={userData?.province || "Pampanga"}
          />
        </View>

        {/* EDIT BUTTON */}

        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            {
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          onPress={() => {
            router.push("/edit-profile");
          }}
        >
          <Text style={styles.editButtonText}>
            Edit Profile
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value || "Not provided"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f8f6",
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

  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 25,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarText: {
    fontSize: 38,
  },

  name: {
    fontSize: 21,
    fontWeight: "900",
    color: "#12372a",
  },

  email: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#12372a",
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 17,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  infoRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#12372a",
  },

  editButton: {
    backgroundColor: "#087f5b",
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 2,
  },

  editButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});