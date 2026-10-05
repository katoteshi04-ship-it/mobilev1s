import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth, db } from "../config/firebase";

export default function ComplaintScreen() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(false);

  const categories = [
    "Noise Complaint",
    "Garbage / Waste",
    "Road / Infrastructure",
    "Peace and Order",
    "Animal Concern",
    "Street / Drainage",
    "Other",
  ];

  const submitComplaint = async () => {
    if (
      !name.trim() ||
      !contact.trim() ||
      !category.trim() ||
      !description.trim()
    ) {
      Alert.alert(
        "Incomplete Form",
        "Please fill in your name, contact number, complaint category, and description."
      );
      return;
    }

    try {
      setLoading(true);

      const user = auth.currentUser;

      await addDoc(collection(db, "complaints"), {
        userId: user?.uid ?? null,

        fullName: name.trim(),
        contactNumber: contact.trim(),

        category: category.trim(),
        description: description.trim(),
        location: location.trim() || null,

        status: "Pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Complaint Submitted",
        "Your complaint has been successfully submitted to BarangayLink.",
        [
          {
            text: "OK",
            onPress: () => {
              setName("");
              setContact("");
              setCategory("");
              setDescription("");
              setLocation("");

              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Complaint submission error:", error);

      Alert.alert(
        "Submission Failed",
        "We could not submit your complaint. Please check your internet connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Submit a Complaint</Text>

            <Text style={styles.headerSubtitle}>
              BarangayLink Resident Portal
            </Text>
          </View>
        </View>

        {/* INTRO */}

        <View style={styles.introCard}>
          <View style={styles.introIcon}>
            <Text style={styles.introIconText}>!</Text>
          </View>

          <View style={styles.introContent}>
            <Text style={styles.introTitle}>
              Report a Concern
            </Text>

            <Text style={styles.introText}>
              Tell us about your concern so the barangay
              can review and respond to it.
            </Text>
          </View>
        </View>

        {/* FORM */}

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>
            Resident Information
          </Text>

          {/* NAME */}

          <Text style={styles.label}>
            Full Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          {/* CONTACT */}

          <Text style={styles.label}>
            Contact Number *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your contact number"
            placeholderTextColor="#9ca3af"
            value={contact}
            onChangeText={setContact}
            keyboardType="phone-pad"
          />

          <Text style={[styles.sectionTitle, styles.complaintSectionTitle]}>
            Complaint Details
          </Text>

          {/* CATEGORY */}

          <Text style={styles.label}>
            Complaint Category *
          </Text>

          <View style={styles.categoryContainer}>
            {categories.map((item) => {
              const selected = category === item;

              return (
                <Pressable
                  key={item}
                  style={[
                    styles.categoryButton,
                    selected && styles.categoryButtonSelected,
                  ]}
                  onPress={() => setCategory(item)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* LOCATION */}

          <Text style={styles.label}>
            Location
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Where did the incident happen?"
            placeholderTextColor="#9ca3af"
            value={location}
            onChangeText={setLocation}
          />

          {/* DESCRIPTION */}

          <Text style={styles.label}>
            Description *
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your complaint or concern..."
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={7}
            textAlignVertical="top"
          />

          <Text style={styles.requiredText}>
            * Required fields
          </Text>

          {/* SUBMIT */}

          <Pressable
            disabled={loading}
            style={({ pressed }) => [
              styles.submitButton,
              {
                opacity: pressed || loading ? 0.7 : 1,
              },
            ]}
            onPress={submitComplaint}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  color="#ffffff"
                  size="small"
                />

                <Text style={styles.submitButtonText}>
                  Submitting...
                </Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                Submit Complaint
              </Text>
            )}
          </Pressable>

          {/* CANCEL */}

          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </Pressable>
        </View>

        {/* INFORMATION */}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            What happens after submission?
          </Text>

          <Text style={styles.infoText}>
            Your complaint will be recorded in BarangayLink
            and sent to the barangay administration for
            review.
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              Initial status: Pending
            </Text>
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            BarangayLink
          </Text>

          <Text style={styles.footerText}>
            Sasmuan, Pampanga
          </Text>

          <Text style={styles.footerCopyright}>
            © 2026 BarangayLink
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
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
    marginRight: 12,
  },

  backButtonText: {
    fontSize: 30,
    color: "#12372a",
    marginTop: -3,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#12372a",
  },

  headerSubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
  },

  /* INTRO */

  introCard: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 18,
  },

  introIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "#d97706",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  introIconText: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "900",
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#92400e",
  },

  introText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#78350f",
    marginTop: 4,
  },

  /* FORM */

  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#12372a",
    marginBottom: 15,
  },

  complaintSectionTitle: {
    marginTop: 10,
  },

  label: {
    fontSize: 12,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#f8faf9",
    borderWidth: 1,
    borderColor: "#dfe5e2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#12372a",
    marginBottom: 15,
  },

  textArea: {
    minHeight: 130,
    textAlignVertical: "top",
  },

  /* CATEGORY */

  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  categoryButton: {
    backgroundColor: "#f8faf9",
    borderWidth: 1,
    borderColor: "#dfe5e2",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginRight: 7,
    marginBottom: 8,
  },

  categoryButtonSelected: {
    backgroundColor: "#087f5b",
    borderColor: "#087f5b",
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4b5563",
  },

  categoryTextSelected: {
    color: "#ffffff",
  },

  requiredText: {
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 12,
  },

  /* BUTTONS */

  submitButton: {
    backgroundColor: "#087f5b",
    borderRadius: 13,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    backgroundColor: "#f1f5f3",
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    color: "#12372a",
    fontSize: 14,
    fontWeight: "700",
  },

  /* INFO */

  infoCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#166534",
  },

  infoText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#166534",
    marginTop: 5,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#d97706",
    marginRight: 7,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400e",
  },

  /* FOOTER */

  footer: {
    alignItems: "center",
    paddingTop: 30,
  },

  footerBrand: {
    fontSize: 14,
    fontWeight: "800",
    color: "#087f5b",
  },

  footerText: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 3,
  },

  footerCopyright: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 8,
  },
});