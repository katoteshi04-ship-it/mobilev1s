import * as Location from "expo-location";
import { router } from "expo-router";
import { createElement, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

/*
============================================================
LOCATION
Approximate center of Sasmuan, Pampanga.
============================================================
*/

const SASMUAN = {
  latitude: 14.8808,
  longitude: 120.6257,
};

const ZOOM_LEVEL = 14;
const TRACKING_ZOOM = 17;

// How long "Locate Me" waits for a GPS fix before giving up
const LOCATE_TIMEOUT_MS = 15000;

/*
============================================================
TYPES
============================================================
*/

type UserCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type MapCommand =
  | {
      type: "location";
      latitude: number;
      longitude: number;
      accuracy: number | null;
    }
  | { type: "recenter" }
  | { type: "sasmuan" };

type PermissionState = "loading" | "granted" | "denied";

/*
============================================================
HELPERS
============================================================
*/

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/*
============================================================
LEAFLET MAP (HTML)
Uses OpenStreetMap tiles. No API key needed.
The app sends commands to the map (new location, recenter, ...)
through window.handleCommand.
============================================================
*/

const mapHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />

    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    />

    <style>
      html, body, #map {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
  </head>

  <body>
    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <script>
      var SASMUAN = [${SASMUAN.latitude}, ${SASMUAN.longitude}];
      var ZOOM = ${ZOOM_LEVEL};
      var TRACKING_ZOOM = ${TRACKING_ZOOM};

      var map = L.map("map", { zoomControl: true }).setView(SASMUAN, ZOOM);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      // Sasmuan marker
      L.marker(SASMUAN)
        .addTo(map)
        .bindPopup("<b>Sasmuan</b><br>Pampanga, Philippines");

      // ---- User location ----
      var follow = true;       // map follows the user until the user drags the map
      var firstFix = true;
      var meMarker = null;
      var meCircle = null;

      map.on("dragstart", function () {
        follow = false;
      });

      function updateLocation(lat, lng, accuracy) {
        var ll = [lat, lng];
        var radius = accuracy && accuracy > 0 ? accuracy : 20;

        if (!meMarker) {
          meCircle = L.circle(ll, {
            radius: radius,
            color: "#2563eb",
            weight: 1,
            fillColor: "#2563eb",
            fillOpacity: 0.12
          }).addTo(map);

          meMarker = L.circleMarker(ll, {
            radius: 9,
            color: "#ffffff",
            weight: 3,
            fillColor: "#2563eb",
            fillOpacity: 1
          }).addTo(map).bindPopup("You are here");
        } else {
          meMarker.setLatLng(ll);
          meCircle.setLatLng(ll);
          meCircle.setRadius(radius);
        }

        if (follow) {
          if (firstFix) {
            map.setView(ll, TRACKING_ZOOM);
          } else {
            map.panTo(ll);
          }
        }

        firstFix = false;
      }

      window.handleCommand = function (cmd) {
        if (!cmd || !cmd.type) return;

        if (cmd.type === "location") {
          updateLocation(cmd.latitude, cmd.longitude, cmd.accuracy);
        } else if (cmd.type === "recenter") {
          follow = true;
          if (meMarker) {
            map.flyTo(meMarker.getLatLng(), TRACKING_ZOOM, { duration: 1 });
            meMarker.openPopup();
          }
        } else if (cmd.type === "sasmuan") {
          follow = false;
          map.flyTo(SASMUAN, ZOOM, { duration: 1 });
        }
      };

      // Used by the web preview (iframe)
      window.addEventListener("message", function (event) {
        if (event.data && event.data.type) {
          window.handleCommand(event.data);
        }
      });

      // Fixes gray/blank tiles when the container resizes
      setTimeout(function () {
        map.invalidateSize();
      }, 300);
    </script>
  </body>
</html>
`;

/*
============================================================
SCREEN
============================================================
*/

export default function MapScreen() {
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const watchingRef = useRef(false);
  const mountedRef = useRef(true);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const [permission, setPermission] = useState<PermissionState>("loading");
  const [servicesOff, setServicesOff] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [coords, setCoords] = useState<UserCoords | null>(null);

  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState("");

  /*
  ------------------------------------------------------------
  SMALL MESSAGE (TOAST) ON THE MAP
  ------------------------------------------------------------
  */

  const showNotice = useCallback((message: string) => {
    setNotice(message);

    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    noticeTimerRef.current = setTimeout(() => {
      setNotice("");
    }, 4000);
  }, []);

  /*
  ------------------------------------------------------------
  SEND A COMMAND TO THE MAP
  ------------------------------------------------------------
  */

  const sendToMap = useCallback((command: MapCommand) => {
    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(command, "*");
      return;
    }

    webViewRef.current?.injectJavaScript(
      `window.handleCommand && window.handleCommand(${JSON.stringify(
        command
      )}); true;`
    );
  }, []);

  /*
  ------------------------------------------------------------
  LIVE TRACKING (WATCH)
  ------------------------------------------------------------
  */

  const startWatching = useCallback(async () => {
    if (watchingRef.current) return;

    watchingRef.current = true;

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // at most every 2 seconds
          distanceInterval: 5, // or when moved 5 meters
        },
        (position: Location.LocationObject) => {
          setServicesOff(false);
          setLocationError("");

          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy ?? null,
          });
        }
      );

      if (!mountedRef.current) {
        sub.remove();
        watchingRef.current = false;
        return;
      }

      subscriptionRef.current = sub;
    } catch (error: any) {
      console.error("Location tracking error:", error);

      watchingRef.current = false;

      if (mountedRef.current) {
        setLocationError(
          error?.message || "Could not get your current location."
        );
      }
    }
  }, []);

  /*
  ------------------------------------------------------------
  ON OPEN: ASK PERMISSION, THEN START TRACKING
  ------------------------------------------------------------
  */

  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (!mountedRef.current) return;

        if (status !== "granted") {
          setPermission("denied");
          return;
        }

        setPermission("granted");

        const enabled = await Location.hasServicesEnabledAsync();

        if (!mountedRef.current) return;

        setServicesOff(!enabled);

        await startWatching();
      } catch (error: any) {
        console.error("Location init error:", error);

        if (mountedRef.current) {
          setLocationError(
            error?.message || "Could not get your current location."
          );
        }
      }
    };

    init();

    return () => {
      mountedRef.current = false;

      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      watchingRef.current = false;

      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, [startWatching]);

  /*
  ------------------------------------------------------------
  PUSH EVERY NEW LOCATION TO THE MAP
  ------------------------------------------------------------
  */

  useEffect(() => {
    if (!mapReady || !coords) return;

    sendToMap({
      type: "location",
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
    });
  }, [coords, mapReady, sendToMap]);

  /*
  ------------------------------------------------------------
  LOCATE ME BUTTON
  Gets a fresh GPS position and flies the map to it.
  ------------------------------------------------------------
  */

  const locateMe = useCallback(async () => {
    if (locating) return;

    if (!mapReady) {
      showNotice("The map is still loading. Please try again.");
      return;
    }

    setLocating(true);

    try {
      // 1. Permission
      let permissionResult = await Location.getForegroundPermissionsAsync();

      if (permissionResult.status !== "granted") {
        permissionResult = await Location.requestForegroundPermissionsAsync();
      }

      if (permissionResult.status !== "granted") {
        setPermission("denied");

        showNotice(
          permissionResult.canAskAgain
            ? "Location permission is needed to find you."
            : "Location is blocked. Tap Open Settings below to allow it."
        );

        return;
      }

      setPermission("granted");

      // 2. GPS must be on
      const enabled = await Location.hasServicesEnabledAsync();

      setServicesOff(!enabled);

      if (!enabled) {
        showNotice("Turn on your phone's location (GPS) first.");
        return;
      }

      // 3. Get a fresh position
      const position = await withTimeout(
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        }),
        LOCATE_TIMEOUT_MS
      );

      const current: UserCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      };

      setCoords(current);
      setLocationError("");

      // 4. Show it on the map, then fly there
      sendToMap({
        type: "location",
        latitude: current.latitude,
        longitude: current.longitude,
        accuracy: current.accuracy,
      });

      sendToMap({ type: "recenter" });

      // 5. Make sure live tracking is running
      startWatching();
    } catch (error: any) {
      console.error("Locate me error:", error);

      showNotice(
        error?.message === "timeout"
          ? "Could not get a GPS signal. Try again outdoors."
          : "Could not get your location. Please try again."
      );
    } finally {
      if (mountedRef.current) {
        setLocating(false);
      }
    }
  }, [locating, mapReady, sendToMap, showNotice, startWatching]);

  /*
  ------------------------------------------------------------
  STATUS TEXT
  ------------------------------------------------------------
  */

  const renderStatus = () => {
    if (permission === "loading") {
      return (
        <Text style={styles.infoText}>Asking for location permission...</Text>
      );
    }

    if (permission === "denied") {
      return (
        <>
          <Text style={styles.infoText}>
            Location permission is off. Allow location access to see where you
            are on the map.
          </Text>

          <Pressable
            style={styles.settingsButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </Pressable>
        </>
      );
    }

    if (servicesOff) {
      return (
        <Text style={styles.infoText}>
          Your phone's location (GPS) is turned off. Turn it on to track your
          position.
        </Text>
      );
    }

    if (locationError) {
      return <Text style={styles.infoText}>{locationError}</Text>;
    }

    if (!coords) {
      return (
        <Text style={styles.infoText}>
          Finding your location... Tap "Locate Me" to try now.
        </Text>
      );
    }

    return (
      <>
        <Text style={styles.infoText}>
          Latitude: {coords.latitude.toFixed(5)}
          {"   "}
          Longitude: {coords.longitude.toFixed(5)}
        </Text>

        {coords.accuracy !== null && (
          <Text style={styles.infoSmall}>
            Accuracy: about {Math.round(coords.accuracy)} meters
          </Text>
        )}
      </>
    );
  };

  /*
  ------------------------------------------------------------
  RENDER
  ------------------------------------------------------------
  */

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            {
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Sasmuan Map</Text>
          <Text style={styles.headerSubtitle}>Pampanga, Philippines</Text>
        </View>

        <View style={{ width: 42 }} />
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <View style={styles.map}>
            {createElement("iframe", {
              ref: iframeRef,
              srcDoc: mapHtml,
              onLoad: () => setMapReady(true),
              style: {
                border: 0,
                width: "100%",
                height: "100%",
              },
              title: "Sasmuan Map",
            })}
          </View>
        ) : (
          <View style={styles.map}>
            <WebView
              ref={webViewRef}
              originWhitelist={["*"]}
              source={{ html: mapHtml }}
              style={styles.map}
              javaScriptEnabled
              domStorageEnabled
              mixedContentMode="always"
              setSupportMultipleWindows={false}
              onLoadEnd={() => setMapReady(true)}
              onError={() => {
                setMapReady(true);
                setMapFailed(true);
              }}
              onHttpError={() => {
                setMapReady(true);
                setMapFailed(true);
              }}
            />
          </View>
        )}

        {!mapReady && !mapFailed && (
          <View style={styles.overlayCenter} pointerEvents="none">
            <ActivityIndicator size="large" color="#087f5b" />
            <Text style={styles.overlayText}>Loading map...</Text>
          </View>
        )}

        {mapFailed && (
          <View style={styles.overlayCenter}>
            <Text style={styles.errorTitle}>Map could not load</Text>
            <Text style={styles.overlayText}>
              Check your internet connection and try again.
            </Text>
          </View>
        )}

        {/* MAP LABEL */}
        <View style={styles.mapLabel} pointerEvents="none">
          <View style={styles.locationDot} />

          <View>
            <Text style={styles.mapLabelTitle}>Sasmuan</Text>

            <Text style={styles.mapLabelSubtitle}>Pampanga, Philippines</Text>
          </View>
        </View>

        {/* TOAST MESSAGE */}
        {notice !== "" && (
          <View style={styles.toast} pointerEvents="none">
            <Text style={styles.toastText}>{notice}</Text>
          </View>
        )}

        {/* FLOATING BUTTONS */}
        <View style={styles.fabColumn}>
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => sendToMap({ type: "sasmuan" })}
          >
            <Text style={styles.fabIcon}>⌂</Text>
            <Text style={styles.fabText}>Sasmuan</Text>
          </Pressable>

          <Pressable
            disabled={locating}
            style={({ pressed }) => [
              styles.fab,
              styles.fabPrimary,
              { opacity: pressed || locating ? 0.8 : 1 },
            ]}
            onPress={locateMe}
          >
            {locating ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={styles.fabSpinner}
              />
            ) : (
              <Text style={[styles.fabIcon, styles.fabPrimaryText]}>◎</Text>
            )}

            <Text style={[styles.fabText, styles.fabPrimaryText]}>
              {locating ? "Locating..." : "Locate Me"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* INFORMATION CARD */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📍 Your Location</Text>

        {renderStatus()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f8f6",
  },

  header: {
    height: 75,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#f5f8f6",
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 30,
    lineHeight: 32,
    color: "#12372a",
  },

  headerCenter: {
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#12372a",
  },

  headerSubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },

  mapContainer: {
    flex: 1,
    position: "relative",
  },

  map: {
    flex: 1,
  },

  overlayCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f8f6",
    padding: 24,
  },

  overlayText: {
    marginTop: 10,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#12372a",
  },

  mapLabel: {
    position: "absolute",
    top: 15,
    left: 15,
    right: 15,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },

  locationDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#087f5b",
    marginRight: 10,
  },

  mapLabelTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#12372a",
  },

  mapLabelSubtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },

  toast: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 20,
    alignItems: "center",
  },

  toastText: {
    backgroundColor: "#12372a",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    overflow: "hidden",
    textAlign: "center",
  },

  fabColumn: {
    position: "absolute",
    right: 15,
    bottom: 25,
    alignItems: "flex-end",
  },

  fab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },

  fabPrimary: {
    backgroundColor: "#087f5b",
    borderColor: "#087f5b",
  },

  fabIcon: {
    fontSize: 16,
    color: "#12372a",
    marginRight: 7,
  },

  fabSpinner: {
    marginRight: 7,
  },

  fabText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#12372a",
  },

  fabPrimaryText: {
    color: "#ffffff",
  },

  infoCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 17,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#12372a",
  },

  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6b7280",
    marginTop: 6,
  },

  infoSmall: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 3,
  },

  settingsButton: {
    alignSelf: "flex-start",
    backgroundColor: "#087f5b",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },

  settingsButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
});