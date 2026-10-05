
import { router } from "expo-router";
import { useState } from "react";
import {
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

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const DOCUMENT_TYPES = [
  "Barangay Clearance",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Scholarship Certificate",
  "Certificate of Good Moral",
  "Business Clearance",
  "Other",
];

const PURPOSES = [
  "Employment",
  "Scholarship",
  "School Requirement",
  "Business",
  "Financial Assistance",
  "Legal Requirement",
  "Personal Use",
  "Other",
];

export default function DocumentScreen() {
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");

  const [documentType, setDocumentType] = useState("");
  const [purpose, setPurpose] = useState("");

  const [showDocumentTypes, setShowDocumentTypes] = useState(false);
  const [showPurposes, setShowPurposes] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      !fullName.trim() ||
      !contact.trim() ||
      !address.trim() ||
      !documentType.trim() ||
      !purpose.trim()
    ) {
      Alert.alert(
        "Incomplete Information",
        "Please complete all required fields."
      );
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Not Signed In",
        "Please sign in to your BarangayLink account before submitting a document request."
      );
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "documentRequests"), {
        userId: user.uid,

        residentName: fullName.trim(),

        residentEmail: user.email || "",

        contactNumber: contact.trim(),

        address: address.trim(),

        requestType: documentType.trim(),

        purpose: purpose.trim(),

        status: "pending",

        requestedAt: serverTimestamp(),

        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Request Submitted",
        "Your document request has been submitted successfully. The barangay office will review your request.",
        [
          {
            text: "OK",
            onPress: () => {
              setFullName("");
              setContact("");
              setAddress("");
              setDocumentType("");
              setPurpose("");

              router.replace("/home");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Document request error:", error);

      Alert.alert(
        "Request Failed",
        "Unable to submit your document request. Please check your internet connection and try again."
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
              disabled={loading}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>
                Document Request
              </Text>

              <Text style={styles.headerSubtitle}>
                BarangayLink Resident Portal
              </Text>
            </View>
          </View>

          {/* INTRO */}

          <View style={styles.introCard}>
            <View style={styles.documentIcon}>
              <Text style={styles.documentIconText}>
                📄
              </Text>
            </View>

            <View style={styles.introContent}>
              <Text style={styles.introTitle}>
                Request a Barangay Document
              </Text>

              <Text style={styles.introText}>
                Select the document you need and
                provide the required information below.
              </Text>
            </View>
          </View>

          {/* FORM */}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Personal Information
            </Text>

            {/* FULL NAME */}

            <Text style={styles.label}>
              Full Name *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
            />

            {/* CONTACT */}

            <Text style={styles.label}>
              Contact Number *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="09XXXXXXXXX"
              placeholderTextColor="#9ca3af"
              value={contact}
              onChangeText={setContact}
              keyboardType="phone-pad"
              editable={!loading}
            />

            {/* ADDRESS */}

            <Text style={styles.label}>
              Complete Address *
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.addressInput,
              ]}
              placeholder="Enter your complete address"
              placeholderTextColor="#9ca3af"
              value={address}
              onChangeText={setAddress}
              multiline
              textAlignVertical="top"
              editable={!loading}
            />

            <View style={styles.divider} />

            {/* DOCUMENT INFORMATION */}

            <Text style={styles.sectionTitle}>
              Document Information
            </Text>

            {/* DOCUMENT TYPE */}

            <Text style={styles.label}>
              Document Type *
            </Text>

            <Pressable
              style={styles.selectButton}
              onPress={() =>
                setShowDocumentTypes(
                  !showDocumentTypes
                )
              }
              disabled={loading}
            >
              <Text
                style={
                  documentType
                    ? styles.selectedText
                    : styles.placeholderText
                }
              >
                {documentType ||
                  "Select document type"}
              </Text>

              <Text style={styles.arrow}>
                {showDocumentTypes ? "▲" : "▼"}
              </Text>
            </Pressable>

            {showDocumentTypes && (
              <View style={styles.optionsContainer}>
                {DOCUMENT_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.option,
                      documentType === type &&
                        styles.optionSelected,
                    ]}
                    onPress={() => {
                      setDocumentType(type);
                      setShowDocumentTypes(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        documentType === type &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>

                    {documentType === type && (
                      <Text style={styles.check}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.helperText}>
              Choose the official barangay document
              that you want to request.
            </Text>

            {/* PURPOSE */}

            <Text style={styles.label}>
              Purpose *
            </Text>

            <Pressable
              style={styles.selectButton}
              onPress={() =>
                setShowPurposes(!showPurposes)
              }
              disabled={loading}
            >
              <Text
                style={
                  purpose
                    ? styles.selectedText
                    : styles.placeholderText
                }
              >
                {purpose || "Select purpose"}
              </Text>

              <Text style={styles.arrow}>
                {showPurposes ? "▲" : "▼"}
              </Text>
            </Pressable>

            {showPurposes && (
              <View style={styles.optionsContainer}>
                {PURPOSES.map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.option,
                      purpose === item &&
                        styles.optionSelected,
                    ]}
                    onPress={() => {
                      setPurpose(item);
                      setShowPurposes(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        purpose === item &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>

                    {purpose === item && (
                      <Text style={styles.check}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.helperText}>
              Select the reason why you need the
              document.
            </Text>

            {/* SUBMIT */}

            <Pressable
              style={[
                styles.submitButton,
                loading &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitIcon}>
                📄
              </Text>

              <Text style={styles.submitButtonText}>
                {loading
                  ? "Submitting..."
                  : "Submit Document Request"}
              </Text>
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
              Important Information
            </Text>

            <Text style={styles.infoText}>
              • Make sure all information provided is
              correct.
            </Text>

            <Text style={styles.infoText}>
              • Your request will be reviewed by
              barangay personnel.
            </Text>

            <Text style={styles.infoText}>
              • You may be contacted using the
              contact number you provided.
            </Text>

            <Text style={styles.infoText}>
              • You can check the status of your
              request through BarangayLink.
            </Text>
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
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  backIcon: {
    fontSize: 31,
    lineHeight: 34,
    color: "#12372a",
    fontWeight: "500",
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
    backgroundColor: "#ecfdf5",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    marginBottom: 18,
  },

  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  documentIconText: {
    fontSize: 23,
  },

  introContent: {
    flex: 1,
  },

  introTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#12372a",
  },

  introText: {
    fontSize: 11,
    lineHeight: 17,
    color: "#527064",
    marginTop: 4,
  },

  /* CARD */

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#12372a",
    marginBottom: 17,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 7,
  },

  input: {
    height: 51,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    marginBottom: 15,
  },

  addressInput: {
    height: 85,
    paddingTop: 13,
  },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 7,
    marginBottom: 20,
  },

  /* SELECT */

  selectButton: {
    minHeight: 51,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  selectedText: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },

  placeholderText: {
    flex: 1,
    fontSize: 14,
    color: "#9ca3af",
  },

  arrow: {
    fontSize: 11,
    color: "#087f5b",
    marginLeft: 10,
  },

  optionsContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },

  option: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  optionSelected: {
    backgroundColor: "#ecfdf5",
  },

  optionText: {
    flex: 1,
    fontSize: 13,
    color: "#374151",
  },

  optionTextSelected: {
    color: "#087f5b",
    fontWeight: "800",
  },

  check: {
    color: "#087f5b",
    fontSize: 17,
    fontWeight: "900",
  },

  helperText: {
    fontSize: 10,
    lineHeight: 15,
    color: "#9ca3af",
    marginBottom: 17,
  },

  /* SUBMIT */

  submitButton: {
    minHeight: 53,
    borderRadius: 13,
    backgroundColor: "#087f5b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    marginTop: 5,

    shadowColor: "#087f5b",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  /* CANCEL */

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

  /* INFORMATION */

  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 17,
    padding: 17,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 18,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#12372a",
    marginBottom: 8,
  },

  infoText: {
    fontSize: 11,
    lineHeight: 18,
    color: "#6b7280",
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
