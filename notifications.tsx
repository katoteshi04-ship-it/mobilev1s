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

import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  referenceId?: string;
  status?: string;
  read?: boolean;
  createdAt?: any;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  /*
  ============================================================
  LOAD NOTIFICATIONS
  ============================================================
  */

  useEffect(() => {
    let unsubscribeNotifications:
      | (() => void)
      | undefined;

    const unsubscribeAuth =
      onAuthStateChanged(
        auth,
        (user) => {

          console.log(
            "===================================="
          );

          console.log(
            "NOTIFICATION AUTH CHECK"
          );

          console.log(
            "Firebase user:",
            user
          );

          console.log(
            "Firebase UID:",
            user?.uid
          );

          console.log(
            "===================================="
          );

          /*
          ------------------------------------------------------
          NO USER
          ------------------------------------------------------
          */

          if (!user) {
            setNotifications([]);
            setLoading(false);

            router.replace("/login");

            return;
          }

          /*
          ------------------------------------------------------
          USER UID
          ------------------------------------------------------
          */

          const currentUserId =
            String(user.uid).trim();

          console.log(
            "CURRENT USER ID:",
            currentUserId
          );

          /*
          ------------------------------------------------------
          QUERY NOTIFICATIONS
          
          IMPORTANT:
          We intentionally DO NOT use orderBy here.
          This avoids requiring a Firestore composite index.
          ------------------------------------------------------
          */

          const notificationsQuery =
            query(
              collection(
                db,
                "notifications"
              ),

              where(
                "userId",
                "==",
                currentUserId
              )
            );

          console.log(
            "Notification listener started."
          );

          /*
          ------------------------------------------------------
          FIRESTORE REALTIME LISTENER
          ------------------------------------------------------
          */

          unsubscribeNotifications =
            onSnapshot(
              notificationsQuery,

              (snapshot) => {

                console.log(
                  "===================================="
                );

                console.log(
                  "NOTIFICATION SNAPSHOT"
                );

                console.log(
                  "Number of documents:",
                  snapshot.size
                );

                /*
                ------------------------------------------------
                DEBUG ALL DOCUMENTS
                ------------------------------------------------
                */

                snapshot.docs.forEach(
                  (item) => {
                    console.log(
                      "Notification document:",
                      item.id,
                      item.data()
                    );
                  }
                );

                /*
                ------------------------------------------------
                CONVERT FIRESTORE DATA
                ------------------------------------------------
                */

                const items =
                  snapshot.docs.map(
                    (item) => {

                      const data =
                        item.data();

                      return {
                        id: item.id,

                        userId:
                          String(
                            data.userId || ""
                          ),

                        title:
                          String(
                            data.title ||
                              "Notification"
                          ),

                        message:
                          String(
                            data.message ||
                              ""
                          ),

                        type:
                          data.type || "",

                        referenceId:
                          data.referenceId ||
                          "",

                        status:
                          data.status || "",

                        read:
                          data.read === true,

                        createdAt:
                          data.createdAt ||
                          null,
                      };
                    }
                  );

                /*
                ------------------------------------------------
                SORT NEWEST FIRST
                ------------------------------------------------
                */

                items.sort(
                  (a, b) => {

                    const aTime =
                      a.createdAt?.toDate
                        ? a.createdAt
                            .toDate()
                            .getTime()
                        : 0;

                    const bTime =
                      b.createdAt?.toDate
                        ? b.createdAt
                            .toDate()
                            .getTime()
                        : 0;

                    return bTime - aTime;
                  }
                );

                console.log(
                  "FINAL NOTIFICATIONS:",
                  items
                );

                console.log(
                  "===================================="
                );

                setNotifications(
                  items
                );

                setLoading(false);
              },

              (error) => {

                console.error(
                  "===================================="
                );

                console.error(
                  "NOTIFICATION FIRESTORE ERROR"
                );

                console.error(
                  error
                );

                console.error(
                  "Error code:",
                  error.code
                );

                console.error(
                  "Error message:",
                  error.message
                );

                console.error(
                  "===================================="
                );

                setNotifications([]);
                setLoading(false);
              }
            );
        }
      );

    /*
    ==========================================================
    CLEANUP
    ==========================================================
    */

    return () => {

      unsubscribeAuth();

      if (
        unsubscribeNotifications
      ) {
        unsubscribeNotifications();
      }
    };
  }, []);

  /*
  ============================================================
  MARK NOTIFICATION AS READ
  ============================================================
  */

  const markAsRead = async (
    notification: NotificationItem
  ) => {

    if (notification.read) {
      return;
    }

    try {

      await updateDoc(
        doc(
          db,
          "notifications",
          notification.id
        ),
        {
          read: true,
        }
      );

      console.log(
        "Notification marked as read:",
        notification.id
      );

    } catch (error) {

      console.error(
        "Mark notification as read error:",
        error
      );
    }
  };

  /*
  ============================================================
  FORMAT DATE
  ============================================================
  */

  const formatDate = (
    timestamp: any
  ) => {

    if (
      !timestamp ||
      !timestamp.toDate
    ) {
      return "Just now";
    }

    try {

      const date =
        timestamp.toDate();

      return date.toLocaleString(
        "en-PH",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }
      );

    } catch {

      return "Just now";
    }
  };

  /*
  ============================================================
  STATUS COLOR
  ============================================================
  */

  const getStatusColor = (
    status?: string
  ) => {

    const normalized =
      String(
        status || ""
      )
        .trim()
        .toLowerCase();

    if (
      normalized ===
      "resolved"
    ) {
      return "#087f5b";
    }

    if (
      normalized ===
      "pending"
    ) {
      return "#d97706";
    }

    return "#2563eb";
  };

  /*
  ============================================================
  STATUS BACKGROUND
  ============================================================
  */

  const getStatusBackground = (
    status?: string
  ) => {

    const normalized =
      String(
        status || ""
      )
        .trim()
        .toLowerCase();

    if (
      normalized ===
      "resolved"
    ) {
      return "#ecfdf5";
    }

    if (
      normalized ===
      "pending"
    ) {
      return "#fffbeb";
    }

    return "#eff6ff";
  };

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <SafeAreaView
      style={styles.safeArea}
    >

      {/* ======================================================
          HEADER
      ======================================================= */}

      <View style={styles.header}>

        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >

          <Text
            style={styles.backText}
          >
            ‹
          </Text>

        </Pressable>

        <View>

          <Text
            style={styles.title}
          >
            Notifications
          </Text>

          <Text
            style={styles.subtitle}
          >
            Updates about your requests
          </Text>

        </View>

      </View>

      {/* ======================================================
          LOADING
      ======================================================= */}

      {loading ? (

        <View
          style={
            styles.loadingContainer
          }
        >

          <ActivityIndicator
            size="large"
            color="#087f5b"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading notifications...
          </Text>

        </View>

      ) : notifications.length ===
        0 ? (

        /* ====================================================
           EMPTY
        ===================================================== */

        <View
          style={
            styles.emptyContainer
          }
        >

          <Text
            style={styles.emptyIcon}
          >
            🔔
          </Text>

          <Text
            style={styles.emptyTitle}
          >
            No Notifications
          </Text>

          <Text
            style={styles.emptyText}
          >
            You don't have any notifications
            yet.
          </Text>

        </View>

      ) : (

        /* ====================================================
           NOTIFICATION LIST
        ===================================================== */

        <ScrollView
          contentContainerStyle={
            styles.container
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          {notifications.map(
            (notification) => {

              const normalizedStatus =
                String(
                  notification.status ||
                    ""
                )
                  .trim()
                  .toLowerCase();

              return (

                <Pressable
                  key={
                    notification.id
                  }

                  onPress={() =>
                    markAsRead(
                      notification
                    )
                  }

                  style={[
                    styles.notificationCard,

                    !notification.read &&
                      styles.unreadCard,
                  ]}
                >

                  {/* ==================================================
                      ICON
                  =================================================== */}

                  <View
                    style={[
                      styles.icon,

                      {
                        backgroundColor:
                          getStatusBackground(
                            normalizedStatus
                          ),
                      },
                    ]}
                  >

                    <Text
                      style={[
                        styles.iconText,

                        {
                          color:
                            getStatusColor(
                              normalizedStatus
                            ),
                        },
                      ]}
                    >

                      {normalizedStatus ===
                      "resolved"
                        ? "✓"
                        : normalizedStatus ===
                          "pending"
                        ? "!"
                        : "i"}

                    </Text>

                  </View>

                  {/* ==================================================
                      CONTENT
                  =================================================== */}

                  <View
                    style={
                      styles.content
                    }
                  >

                    <View
                      style={
                        styles.titleRow
                      }
                    >

                      <Text
                        style={
                          styles.notificationTitle
                        }
                      >

                        {
                          notification.title ||
                          "Notification"
                        }

                      </Text>

                      {!notification.read && (

                        <View
                          style={
                            styles.unreadDot
                          }
                        />

                      )}

                    </View>

                    {/* MESSAGE */}

                    <Text
                      style={
                        styles.notificationMessage
                      }
                    >

                      {
                        notification.message ||
                        "You have a new notification."
                      }

                    </Text>

                    {/* STATUS */}

                    {notification.status && (

                      <View
                        style={[
                          styles.statusBadge,

                          {
                            backgroundColor:
                              getStatusBackground(
                                normalizedStatus
                              ),
                          },
                        ]}
                      >

                        <Text
                          style={[
                            styles.statusText,

                            {
                              color:
                                getStatusColor(
                                  normalizedStatus
                                ),
                            },
                          ]}
                        >

                          {String(
                            notification.status
                          ).toUpperCase()}

                        </Text>

                      </View>

                    )}

                    {/* DATE */}

                    <Text
                      style={
                        styles.date
                      }
                    >

                      {formatDate(
                        notification.createdAt
                      )}

                    </Text>

                  </View>

                </Pressable>
              );
            }
          )}

        </ScrollView>
      )}

    </SafeAreaView>
  );
}

/*
============================================================
STYLES
============================================================
*/

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#f5f8f6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f8f6",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 12,
  },

  backText: {
    fontSize: 32,
    lineHeight: 35,
    color: "#12372a",
  },

  title: {
    fontSize: 21,
    fontWeight: "900",
    color: "#12372a",
  },

  subtitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },

  container: {
    padding: 20,
    paddingTop: 0,
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

  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 17,
    padding: 15,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  unreadCard: {
    borderColor: "#bbf7d0",
    backgroundColor: "#fbfffd",
  },

  icon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  iconText: {
    fontSize: 19,
    fontWeight: "900",
  },

  content: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#12372a",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#087f5b",
    marginLeft: 7,
  },

  notificationMessage: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
    marginTop: 5,
  },

  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  date: {
    fontSize: 9,
    color: "#9ca3af",
    marginTop: 8,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#12372a",
  },

  emptyText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5,
    textAlign: "center",
  },

});
