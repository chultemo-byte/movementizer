import { useCallback, useEffect, useRef, useState, type ComponentType, type RefAttributes } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewProps } from "react-native-webview";
import type {
  ShouldStartLoadRequest,
  WebViewHttpErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
} from "react-native-webview/lib/WebViewTypes";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import * as SplashScreen from "expo-splash-screen";
import {
  alertsEnabled,
  checkForStatusChanges,
  disableAlerts,
  enableAlerts,
  prepareNotifications,
} from "./alerts";
import { AlertsSheet } from "./AlertsSheet";
import { BACK_JS, BRIDGE_JS } from "./inject";
import { decideNavigation, shareUrlOnSite, SITE_URL } from "./navigationPolicy";
import { OfflineScreen } from "./OfflineScreen";
import { colors } from "./theme";

// SDK 58's WebView class defaults its type parameter to undefined, and
// WebViewProps & undefined collapses to never under this TypeScript.
const SiteView = WebView as unknown as ComponentType<WebViewProps & RefAttributes<WebView>>;
const ORIGIN_WHITELIST = ["https://*", "http://*", "about:*"];

type SharePayload = { title?: string; text?: string; url?: string };

export function WebShell() {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const skipLoadHaptic = useRef(true);
  const splashHidden = useRef(false);
  const lastShare = useRef(0);
  const [offline, setOffline] = useState(false);
  const [webError, setWebError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [alertNote, setAlertNote] = useState("Off. Nothing is checked.");

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const tap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const openExternal = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {});
  }, []);

  const onShouldStart = useCallback(
    (request: ShouldStartLoadRequest) => {
      const decision = decideNavigation(request.url, request.isTopFrame, request.mainDocumentURL);
      if (decision === "allow") return true;
      if (decision === "external") openExternal(request.url);
      return false;
    },
    [openExternal],
  );

  const shareFromSite = useCallback(
    async (payload: SharePayload) => {
      const url = typeof payload.url === "string" ? shareUrlOnSite(payload.url) : null;
      if (!url) return;
      const now = Date.now();
      if (now - lastShare.current < 800) return;
      lastShare.current = now;
      const title = cleanLine(payload.title, "Movementizer");
      const text = cleanLine(payload.text, title + " - a movement window on Movementizer, the Earth radar.");
      tap();
      try {
        if (Platform.OS === "ios") {
          await Share.share({ title, message: text, url });
        } else {
          await Share.share({ title, message: text + " " + url });
        }
      } catch {
        // The sheet was dismissed or the system refused it.
      }
    },
    [tap],
  );

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let data: { type?: string; handled?: boolean; title?: string; text?: string; url?: string };
      try {
        data = JSON.parse(event.nativeEvent.data) as typeof data;
      } catch {
        return;
      }
      if (data.type === "share") {
        void shareFromSite(data);
      } else if (data.type === "haptic") {
        tap();
      } else if (data.type === "refresh") {
        tap();
        webRef.current?.reload();
      } else if (data.type === "back") {
        if (data.handled) return;
        if (canGoBack.current) webRef.current?.goBack();
        else BackHandler.exitApp();
      }
    },
    [shareFromSite, tap],
  );

  const onNav = useCallback((nav: WebViewNavigation) => {
    canGoBack.current = nav.canGoBack;
  }, []);

  const retry = useCallback(() => {
    tap();
    skipLoadHaptic.current = true;
    setWebError(false);
    setReloadKey((value) => value + 1);
  }, [tap]);

  const onAlertsChange = useCallback(
    (next: boolean) => {
      Haptics.selectionAsync().catch(() => {});
      if (!next) {
        setAlertsOn(false);
        setAlertNote("Off. Nothing is checked.");
        void disableAlerts();
        return;
      }
      void enableAlerts().then((result) => {
        if (result === "denied") {
          setAlertsOn(false);
          setAlertNote("Notifications are off in system settings.");
          return;
        }
        setAlertsOn(true);
        setAlertNote("On. Checked when you open the app.");
      });
    },
    [],
  );

  useEffect(() => {
    void prepareNotifications();
    void alertsEnabled().then(setAlertsOn);
    const net = NetInfo.addEventListener((state) => {
      const down = state.isConnected === false || state.isInternetReachable === false;
      setOffline(down);
      if (down) hideSplash();
    });
    const app = AppState.addEventListener("change", (next) => {
      if (next === "active") void checkForStatusChanges();
    });
    const splashLimit = setTimeout(hideSplash, 8000);
    return () => {
      net();
      app.remove();
      clearTimeout(splashLimit);
    };
  }, [hideSplash]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (alertsOpen) {
        setAlertsOpen(false);
        return true;
      }
      if (offline || webError) return false;
      webRef.current?.injectJavaScript(BACK_JS);
      return true;
    });
    return () => sub.remove();
  }, [alertsOpen, offline, webError]);

  const onHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      if (event.nativeEvent.statusCode >= 500) {
        setWebError(true);
        hideSplash();
      }
    },
    [hideSplash],
  );

  const showOffline = offline || webError;

  return (
    <View style={styles.root}>
      <View style={[styles.chrome, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Alerts"
          onPress={() => {
            tap();
            setAlertsOpen(true);
            setAlertNote(alertsOn ? "On. Checked when you open the app." : "Off. Nothing is checked.");
          }}
          style={styles.alerts}
        >
          <Text style={styles.alertsText}>Alerts</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
      {showOffline ? (
        <OfflineScreen onRetry={retry} />
      ) : (
        <SiteView
          key={reloadKey}
          ref={webRef}
          source={{ uri: SITE_URL }}
          style={styles.web}
          originWhitelist={ORIGIN_WHITELIST}
          onShouldStartLoadWithRequest={onShouldStart}
          onOpenWindow={(event) => openExternal(event.nativeEvent.targetUrl)}
          setSupportMultipleWindows={false}
          onMessage={onMessage}
          onNavigationStateChange={onNav}
          injectedJavaScriptBeforeContentLoaded={BRIDGE_JS}
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly
          pullToRefreshEnabled
          refreshControlLightMode
          contentInsetAdjustmentBehavior="never"
          allowsBackForwardNavigationGestures
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.teal} />
            </View>
          )}
          onLoadStart={() => {
            if (skipLoadHaptic.current) {
              skipLoadHaptic.current = false;
              return;
            }
            tap();
          }}
          onLoadEnd={() => {
            setWebError(false);
            hideSplash();
            void checkForStatusChanges();
          }}
          onError={() => {
            setWebError(true);
            hideSplash();
          }}
          onHttpError={onHttpError}
        />
      )}
      </View>
      <View style={{ height: insets.bottom }} />
      <AlertsSheet
        visible={alertsOpen}
        enabled={alertsOn}
        note={alertNote}
        onClose={() => setAlertsOpen(false)}
        onChange={onAlertsChange}
      />
    </View>
  );
}

function cleanLine(value: string | undefined, fallback: string): string {
  const text = (value || "").replace(/[\u0000-\u001f]/g, " ").trim();
  if (!text) return fallback;
  return text.slice(0, 180);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  chrome: {
    backgroundColor: colors.bg,
    paddingBottom: 6,
    paddingRight: 12,
    alignItems: "flex-end",
  },
  body: {
    flex: 1,
  },
  web: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  alerts: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(72,224,192,0.45)",
    backgroundColor: "rgba(10,14,22,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertsText: {
    color: colors.teal,
    fontSize: 14,
    fontWeight: "600",
  },
});
