import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth, db } from "../config/firebase";

type Announcement = {
  id: string;
  title?: string;
  content?: string;
  category?: string;
  status?: string;
  imageURL?: string;
  authorEmail?: string;
  authorUid?: string;
  createdAt?: any;
  updatedAt?: any;
};

export default function HomeScreen() {
  const [residentName, setResidentName] =
    useState("Resident");

  const [notificationCount, setNotificationCount] =
    useState(0);

  const [loadingUser, setLoadingUser] =
    useState(true);

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [loadingAnnouncements, setLoadingAnnouncements] =
    useState(true);

  // ==========================================
  // EMERGENCY CONTACTS
  // ==========================================

  const emergencyContacts = [
    {
      icon: "👮",
      title: "Police",
      number: "09985985469",
      color: "#2563eb",
      background: "#eff6ff",
    },
    {
      icon: "🚒",
      title: "Firefighter",
      number: "09427312489",
      color: "#dc2626",
      background: "#fef2f2",
    },
    {
      icon: "🚑",
      title: "Ambulance",
      number: "09632480050",
      color: "#059669",
      background: "#ecfdf5",
    },
  ];

  // ==========================================
  // LOAD USER
  // ==========================================

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

          const userSnapshot =
            await getDoc(userRef);

          if (userSnapshot.exists()) {
            const data = userSnapshot.data();

            setResidentName(
              data.fullName ||
                data.name ||
                user.displayName ||
                "Resident"
            );
          } else {
            setResidentName(
              user.displayName || "Resident"
            );
          }
        } catch (error) {
          console.log(
            "Error loading user:",
            error
          );

          setResidentName(
            user.displayName || "Resident"
          );
        } finally {
          setLoadingUser(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  // ==========================================
  // LOAD PUBLISHED ANNOUNCEMENTS
  // ==========================================

  useEffect(() => {
    const announcementsRef =
      collection(db, "announcements");

    const announcementsQuery = query(
      announcementsRef,
      where("status", "==", "published")
    );

    const unsubscribe = onSnapshot(
      announcementsQuery,
      (snapshot) => {
        const announcementList: Announcement[] =
          snapshot.docs.map((announcementDoc) => ({
            id: announcementDoc.id,
            ...announcementDoc.data(),
          })) as Announcement[];

        // Sort newest first.
        // Compatible kahit string ang createdAt.
        announcementList.sort((a, b) => {
          const dateA =
            getAnnouncementDate(a.createdAt);

          const dateB =
            getAnnouncementDate(b.createdAt);

          return dateB - dateA;
        });

        setAnnouncements(announcementList);
        setLoadingAnnouncements(false);
      },
      (error) => {
        console.log(
          "Announcement listener error:",
          error
        );

        setAnnouncements([]);
        setLoadingAnnouncements(false);
      }
    );

    return unsubscribe;
  }, []);

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        setNotificationCount(
          snapshot.size
        );
      },
      (error) => {
        console.log(
          "Notification listener error:",
          error
        );
      }
    );

    return unsubscribe;
  }, []);

  // ==========================================
  // NAVIGATION
  // ==========================================

  const goToEmergency = () => {
    router.push("/emergency");
  };

  const goToComplaint = () => {
    router.push("/complaint");
  };

  const goToDocument = () => {
    router.push("/document");
  };

  const goToProfile = () => {
    router.push("/profile");
  };

  const goToNotifications = () => {
    router.push("/notifications");
  };

  const showMap = () => {
    router.push("/map");
  };

  // ==========================================
  // ANNOUNCEMENT FUNCTIONS
  // ==========================================

  const showAnnouncement = (
    announcement: Announcement
  ) => {
    Alert.alert(
      announcement.title ||
        "Barangay Announcement",
      announcement.content ||
        "No announcement details available.",
      [
        {
          text: "Close",
          style: "cancel",
        },
      ]
    );
  };

  const showUpdates = () => {
    if (announcements.length === 0) {
      Alert.alert(
        "📢 Latest Updates",
        "Wala pang published announcements mula sa barangay."
      );

      return;
    }

    const latestAnnouncement =
      announcements[0];

    showAnnouncement(
      latestAnnouncement
    );
  };

  // ==========================================
  // DIRECT PHONE CALL
  // ==========================================

  const callEmergencyContact = async (
    number: string
  ) => {
    try {
      const phoneUrl = `tel:${number}`;

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.log(
        "Call error:",
        error
      );

      Alert.alert(
        "Unable to Call",
        "Hindi mabuksan ang phone dialer. Siguraduhing physical cellphone ang ginagamit."
      );
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);

              router.replace("/login");
            } catch (error) {
              console.log(
                "Logout error:",
                error
              );

              Alert.alert(
                "Error",
                "Unable to logout. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>
                B
              </Text>
            </View>

            <View>
              <Text style={styles.brandName}>
                BarangayLink
              </Text>

              <Text
                style={styles.brandSubtitle}
              >
                RESIDENT PORTAL
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.notificationButton,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={goToNotifications}
          >
            <Text
              style={styles.notificationIcon}
            >
              🔔
            </Text>

            {notificationCount > 0 && (
              <View
                style={
                  styles.notificationBadge
                }
              >
                <Text
                  style={
                    styles.notificationBadgeText
                  }
                >
                  {notificationCount > 99
                    ? "99+"
                    : notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* LOCATION */}

        <View style={styles.locationCard}>
          <View style={styles.locationDot} />

          <View>
            <Text
              style={styles.locationTitle}
            >
              Sasmuan
            </Text>

            <Text
              style={styles.locationSubtitle}
            >
              Pampanga, Philippines
            </Text>
          </View>
        </View>

        {/* WELCOME */}

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSmall}>
            {loadingUser
              ? "WELCOME TO BARANGAYLINK"
              : `WELCOME, ${residentName.toUpperCase()}`}
          </Text>

          <Text style={styles.welcomeTitle}>
            Your Barangay,{"\n"}
            Connected.
          </Text>

          <Text
            style={styles.welcomeDescription}
          >
            Access barangay services, report
            concerns, request documents, and
            stay updated with your community.
          </Text>
        </View>

        {/* QUICK SERVICES */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Quick Services
          </Text>

          <Text style={styles.sectionHint}>
            Access services
          </Text>
        </View>

        <View style={styles.servicesGrid}>
          <ServiceCard
            icon="⚠"
            title="Emergency"
            description="Report an emergency"
            color="#dc2626"
            background="#fef2f2"
            onPress={goToEmergency}
          />

          <ServiceCard
            icon="!"
            title="Complaints"
            description="Report a concern"
            color="#d97706"
            background="#fffbeb"
            onPress={goToComplaint}
          />

          <ServiceCard
            icon="▤"
            title="Documents"
            description="Request documents"
            color="#2563eb"
            background="#eff6ff"
            onPress={goToDocument}
          />

          <ServiceCard
            icon="◉"
            title="Sasmuan Map"
            description="View locations"
            color="#087f5b"
            background="#ecfdf5"
            onPress={showMap}
          />
        </View>

        {/* EMERGENCY CONTACTS */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Emergency Contacts
          </Text>

          <Text style={styles.sectionHint}>
            Tap to call
          </Text>
        </View>

        <View
          style={
            styles.emergencyContactsContainer
          }
        >
          {emergencyContacts.map(
            (contact) => (
              <Pressable
                key={contact.title}
                onPress={() =>
                  callEmergencyContact(
                    contact.number
                  )
                }
                style={({ pressed }) => [
                  styles.emergencyContactCard,
                  {
                    opacity: pressed
                      ? 0.7
                      : 1,
                    transform: [
                      {
                        scale: pressed
                          ? 0.97
                          : 1,
                      },
                    ],
                  },
                ]}
              >
                <View
                  style={[
                    styles.emergencyContactIcon,
                    {
                      backgroundColor:
                        contact.background,
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.emergencyContactIconText
                    }
                  >
                    {contact.icon}
                  </Text>
                </View>

                <Text
                  style={
                    styles.emergencyContactTitle
                  }
                >
                  {contact.title}
                </Text>

                <Text
                  style={[
                    styles.emergencyContactNumber,
                    {
                      color:
                        contact.color,
                    },
                  ]}
                >
                  {contact.number}
                </Text>

                <Text
                  style={
                    styles.emergencyContactAction
                  }
                >
                  Tap to call
                </Text>
              </Pressable>
            )
          )}
        </View>

        {/* ==========================================
            LATEST UPDATES / ANNOUNCEMENTS
            ========================================== */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Latest Updates
          </Text>

          <Pressable
            onPress={showUpdates}
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={styles.viewAll}>
              View all
            </Text>
          </Pressable>
        </View>

        {loadingAnnouncements ? (
          <View style={styles.announcementCard}>
            <View
              style={styles.announcementIcon}
            >
              <Text
                style={
                  styles.announcementIconText
                }
              >
                i
              </Text>
            </View>

            <View
              style={styles.announcementContent}
            >
              <Text
                style={
                  styles.announcementLabel
                }
              >
                BARANGAY ANNOUNCEMENT
              </Text>

              <Text
                style={
                  styles.announcementTitle
                }
              >
                Loading announcements...
              </Text>

              <Text
                style={styles.announcementText}
              >
                Please wait while we get the
                latest announcements.
              </Text>
            </View>
          </View>
        ) : announcements.length === 0 ? (
          <View style={styles.announcementCard}>
            <View
              style={styles.announcementIcon}
            >
              <Text
                style={
                  styles.announcementIconText
                }
              >
                i
              </Text>
            </View>

            <View
              style={styles.announcementContent}
            >
              <Text
                style={
                  styles.announcementLabel
                }
              >
                BARANGAY ANNOUNCEMENT
              </Text>

              <Text
                style={
                  styles.announcementTitle
                }
              >
                No announcements yet
              </Text>

              <Text
                style={styles.announcementText}
              >
                Wala pang published announcement
                mula sa barangay.
              </Text>

              <Text
                style={styles.announcementDate}
              >
                Check again later
              </Text>
            </View>
          </View>
        ) : (
          announcements
            .slice(0, 3)
            .map((announcement) => (
              <Pressable
                key={announcement.id}
                style={({ pressed }) => [
                  styles.announcementCard,
                  {
                    opacity: pressed
                      ? 0.75
                      : 1,
                  },
                ]}
                onPress={() =>
                  showAnnouncement(
                    announcement
                  )
                }
              >
                <View
                  style={
                    styles.announcementIcon
                  }
                >
                  <Text
                    style={
                      styles.announcementIconText
                    }
                  >
                    i
                  </Text>
                </View>

                <View
                  style={
                    styles.announcementContent
                  }
                >
                  <Text
                    style={
                      styles.announcementLabel
                    }
                  >
                    BARANGAY ANNOUNCEMENT
                  </Text>

                  <Text
                    style={
                      styles.announcementTitle
                    }
                    numberOfLines={2}
                  >
                    {announcement.title ||
                      "Barangay Announcement"}
                  </Text>

                  <Text
                    style={
                      styles.announcementText
                    }
                    numberOfLines={3}
                  >
                    {announcement.content ||
                      "No announcement details available."}
                  </Text>

                  <Text
                    style={
                      styles.announcementDate
                    }
                  >
                    {formatAnnouncementDate(
                      announcement.createdAt
                    )}
                    {" • Tap to read"}
                  </Text>
                </View>
              </Pressable>
            ))
        )}

        {/* EMERGENCY CTA */}

        <View style={styles.emergencyCard}>
          <View style={styles.emergencyIcon}>
            <Text
              style={styles.emergencyIconText}
            >
              !
            </Text>
          </View>

          <View
            style={styles.emergencyContent}
          >
            <Text
              style={styles.emergencyTitle}
            >
              Need immediate help?
            </Text>

            <Text style={styles.emergencyText}>
              Send an emergency report to the
              barangay response team.
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.emergencyButton,
              {
                opacity: pressed
                  ? 0.75
                  : 1,
              },
            ]}
            onPress={goToEmergency}
          >
            <Text
              style={
                styles.emergencyButtonText
              }
            >
              Report
            </Text>
          </Pressable>
        </View>

        {/* PROFILE */}

        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text
                style={
                  styles.profileAvatarText
                }
              >
                👤
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {residentName}
              </Text>

              <Text
                style={
                  styles.profileDescription
                }
              >
                View and manage your account
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.profileButton,
              {
                opacity: pressed
                  ? 0.75
                  : 1,
              },
            ]}
            onPress={goToProfile}
          >
            <Text
              style={styles.profileButtonText}
            >
              View Profile
            </Text>
          </Pressable>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>
            BarangayLink
          </Text>

          <Text style={styles.footerText}>
            Sasmuan, Pampanga
          </Text>

          <Text
            style={styles.footerCopyright}
          >
            © 2026 BarangayLink
          </Text>
        </View>

        {/* LOGOUT */}

        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            {
              opacity: pressed
                ? 0.75
                : 1,
            },
          ]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>
            ⇥
          </Text>

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </Pressable>

        <Text style={styles.versionText}>
          BarangayLink Resident Portal
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==========================================
// HELPER: GET ANNOUNCEMENT DATE
// ==========================================

function getAnnouncementDate(
  value: any
): number {
  if (!value) {
    return 0;
  }

  // Firestore Timestamp
  if (
    typeof value?.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  // JavaScript Date
  if (value instanceof Date) {
    return value.getTime();
  }

  // Number timestamp
  if (typeof value === "number") {
    return value;
  }

  // String date
  if (typeof value === "string") {
    const parsed = Date.parse(value);

    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return 0;
}

// ==========================================
// HELPER: FORMAT DATE
// ==========================================

function formatAnnouncementDate(
  value: any
): string {
  const timestamp =
    getAnnouncementDate(value);

  if (!timestamp) {
    return "Recently published";
  }

  return new Date(
    timestamp
  ).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ==========================================
// SERVICE CARD
// ==========================================

function ServiceCard({
  icon,
  title,
  description,
  color,
  background,
  onPress,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
  background: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.serviceCard,
        {
          opacity: pressed ? 0.75 : 1,
          transform: [
            {
              scale: pressed ? 0.98 : 1,
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.serviceIcon,
          {
            backgroundColor: background,
          },
        ]}
      >
        <Text
          style={[
            styles.serviceIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.serviceTitle}>
        {title}
      </Text>

      <Text
        style={styles.serviceDescription}
      >
        {description}
      </Text>
    </Pressable>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f8f6",
  },

  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingBottom: 18,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#087f5b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  logoText: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "900",
  },

  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#12372a",
  },

  brandSubtitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.3,
    color: "#6b7280",
    marginTop: 2,
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    position: "relative",
  },

  notificationIcon: {
    fontSize: 18,
  },

  notificationBadge: {
    position: "absolute",
    right: -3,
    top: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  notificationBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 25,
  },

  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#087f5b",
    marginRight: 10,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#12372a",
  },

  locationSubtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  welcomeSection: {
    marginBottom: 28,
  },

  welcomeSmall: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#087f5b",
    marginBottom: 8,
  },

  welcomeTitle: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: "#12372a",
  },

  welcomeDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6b7280",
    marginTop: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#12372a",
  },

  sectionHint: {
    fontSize: 11,
    color: "#9ca3af",
  },

  viewAll: {
    fontSize: 12,
    fontWeight: "700",
    color: "#087f5b",
  },

  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  serviceCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 17,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  serviceIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  serviceIconText: {
    fontSize: 21,
    fontWeight: "800",
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#12372a",
  },

  serviceDescription: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 16,
  },

  // ==========================================
  // EMERGENCY CONTACTS
  // ==========================================

  emergencyContactsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  emergencyContactCard: {
    width: "31.5%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },

  emergencyContactIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  emergencyContactIconText: {
    fontSize: 22,
  },

  emergencyContactTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#12372a",
    textAlign: "center",
  },

  emergencyContactNumber: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    textAlign: "center",
  },

  emergencyContactAction: {
    fontSize: 9,
    color: "#087f5b",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "700",
  },

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================

  announcementCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 17,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },

  announcementIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  announcementIconText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2563eb",
  },

  announcementContent: {
    flex: 1,
  },

  announcementLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#2563eb",
    marginBottom: 5,
  },

  announcementTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#12372a",
  },

  announcementText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
    marginTop: 5,
  },

  announcementDate: {
    fontSize: 10,
    color: "#087f5b",
    marginTop: 8,
    fontWeight: "700",
  },

  // ==========================================
  // EMERGENCY CTA
  // ==========================================

  emergencyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff7f7",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  emergencyIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#dc2626",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  emergencyIconText: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "900",
  },

  emergencyContent: {
    flex: 1,
  },

  emergencyTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991b1b",
  },

  emergencyText: {
    fontSize: 11,
    lineHeight: 16,
    color: "#7f1d1d",
    marginTop: 3,
  },

  emergencyButton: {
    backgroundColor: "#dc2626",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    marginLeft: 8,
  },

  emergencyButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },

  // ==========================================
  // PROFILE
  // ==========================================

  profileSection: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 17,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  profileAvatarText: {
    fontSize: 25,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#12372a",
  },

  profileDescription: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 3,
  },

  profileButton: {
    backgroundColor: "#087f5b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },

  profileButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
  },

  // ==========================================
  // FOOTER
  // ==========================================

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

  // ==========================================
  // LOGOUT
  // ==========================================

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderRadius: 13,
    paddingVertical: 13,
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  logoutIcon: {
    fontSize: 18,
    color: "#dc2626",
    marginRight: 8,
    fontWeight: "800",
  },

  logoutText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "800",
  },

  versionText: {
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 10,
  },
});
