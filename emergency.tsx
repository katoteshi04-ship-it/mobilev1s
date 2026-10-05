import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

import { db } from "../firebase/config";

export default function EmergencyScreen() {
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [emergencyType, setEmergencyType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      !fullName.trim() ||
      !contact.trim() ||
      !emergencyType.trim() ||
      !location.trim() ||
      !description.trim()
    ) {
      Alert.alert(
        "Incomplete Form",
        "Please complete all required fields."
      );
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "emergencyReports"), {
        fullName: fullName.trim(),
        contact: contact.trim(),
        emergencyType: emergencyType.trim(),
        location: location.trim(),
        description: description.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Emergency Report Sent",
        "Your emergency report has been received by BarangayLink. The barangay response team can now review your report.",
        [
          {
            text: "OK",
            onPress: () => {
              setFullName("");
              setContact("");
              setEmergencyType("");
              setLocation("");
              setDescription("");

              router.back();
            },
          },
        ]
      );
    } catch (error) {
      console.error(
        "Emergency report error:",
        error
      );

      Alert.alert(
        "Submission Failed",
        "Unable to send your emergency report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>
                ‹
              </Text>
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                Emergency Report
              </Text>

              <Text style={styles.headerSubtitle}>
                BarangayLink Emergency Services
              </Text>
            </View>
          </View>

          {/* EMERGENCY WARNING */}

          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Text style={styles.warningIconText}>
                !
              </Text>
            </View>

            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>
                Need Immediate Help?
              </Text>

              <Text style={styles.warningText}>
                Use this form to notify the barangay
                about an emergency in your area.
              </Text>
            </View>
          </View>

          {/* IMPORTANT NOTICE */}

          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>
              Important
            </Text>

            <Text style={styles.noticeText}>
              For life-threatening emergencies,
              contact the appropriate emergency
              service immediately. This form is
              intended to notify your barangay
              response team.
            </Text>
          </View>

          {/* FORM */}

          <View style={styles.card}>
            <Text style={styles.formTitle}>
              Emergency Information
            </Text>

            <Text style={styles.formDescription}>
              Please provide accurate information
              so the response team can understand
              the situation.
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
            />

            {/* CONTACT */}

            <Text style={styles.label}>
              Contact Number
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your contact number"
              placeholderTextColor="#9ca3af"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
            />

            {/* EMERGENCY TYPE */}

            <Text style={styles.label}>
              Type of Emergency
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Fire, Accident, Medical"
              placeholderTextColor="#9ca3af"
              value={emergencyType}
              onChangeText={setEmergencyType}
            />

            {/* LOCATION */}

            <Text style={styles.label}>
              Emergency Location
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter the exact location"
              placeholderTextColor="#9ca3af"
              value={location}
              onChangeText={setLocation}
            />

            {/* DESCRIPTION */}

            <Text style={styles.label}>
              Describe the Emergency
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Explain what happened..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <Text style={styles.helperText}>
              Include important details such as the
              number of people involved, injuries,
              hazards, or other relevant information.
            </Text>

            {/* SEND BUTTON */}

            <Pressable
              style={[
                styles.sendButton,
                loading &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#ffffff"
                />
              ) : (
                <>
                  <Text style={styles.sendIcon}>
                    !
                  </Text>

                  <Text style={styles.sendButtonText}>
                    Send Emergency Report
                  </Text>
                </>
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

          {/* STATUS INFO */}

          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Text style={styles.statusIconText}>
                ✓
              </Text>
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                After submitting
              </Text>

              <Text style={styles.statusText}>
                Your report will be recorded in the
                barangay system with a pending status
                for review by authorized personnel.
              </Text>
            </View>
          </View>

          {/* FOOTER */}

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>
              BarangayLink
            </Text>

            <Text style={styles.footerLocation}>
              Sasmuan, Pampanga
            </Text>

            <Text style={styles.footerCopyright}>
              © 2026 BarangayLink
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#f5f8f6",
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backIcon: {
    fontSize: 31,
    lineHeight: 33,
    color: "#12372a",
    fontWeight: "400",
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#12372a",
  },

  headerSubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3,
  },

  /* WARNING */

  warningCard: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 13,
  },

  warningIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  warningIconText: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "900",
  },

  warningContent: {
    flex: 1,
    justifyContent: "center",
  },

  warningTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#991b1b",
  },

  warningText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#7f1d1d",
    marginTop: 3,
  },

  /* NOTICE */

  noticeCard: {
    backgroundColor: "#fff7ed",
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#fed7aa",
    marginBottom: 18,
  },

  noticeTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#9a3412",
    marginBottom: 4,
  },

  noticeText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#9a3412",
  },

  /* FORM */

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 21,
    borderWidth: 1,
    borderColor: "#e5e7eb",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  formTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#12372a",
  },

  formDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
    marginTop: 5,
    marginBottom: 20,
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
    marginBottom: 17,
  },

  textArea: {
    minHeight: 125,
    paddingTop: 14,
    paddingBottom: 14,
  },

  helperText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#9ca3af",
    marginTop: -8,
    marginBottom: 17,
  },

  /* SEND */

  sendButton: {
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",

    shadowColor: "#dc2626",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },

  sendButtonDisabled: {
    opacity: 0.65,
  },

  sendIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginRight: 8,
  },

  sendButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  cancelButton: {
    height: 50,
    borderRadius: 13,
    backgroundColor: "#f1f5f3",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  cancelButtonText: {
    color: "#12372a",
    fontSize: 14,
    fontWeight: "700",
  },

  /* STATUS */

  statusCard: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    borderRadius: 17,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },

  statusIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#087f5b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  statusIconText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#166534",
  },

  statusText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#15803d",
    marginTop: 4,
  },

  /* FOOTER */

  footer: {
    alignItems: "center",
    paddingTop: 28,
  },

  footerBrand: {
    fontSize: 14,
    fontWeight: "800",
    color: "#087f5b",
  },

  footerLocation: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 3,
  },

  footerCopyright: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 7,
  },
});