import { useCallback, useEffect, useRef, useState, type ComponentType, type RefAttributes } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { chooseBackAction, shouldCommitEdgeBack } from "./edgeSwipe";
import { BACK_JS, BRIDGE_JS } from "./inject";
import { decideNavigation, pageFromUrl, shareUrlOnSite, SITE_URL, type SitePage } from "./navigationPolicy";
import { OfflineScreen } from "./OfflineScreen";
import { colors } from "./theme";

// SDK 58's WebView class defaults its type parameter to undefined, and
// WebViewProps & undefined collapses to never under this TypeScript.
const SiteView = WebView as unknown as ComponentType<WebViewProps & RefAttributes<WebView>>;
const ORIGIN_WHITELIST = ["https://*", "http://*", "about:*"];
const LEGAL: { page: Exclude<SitePage, "home" | "other">; path: string; label: string; name: string }[] = [
  { page: "privacy", path: "/privacy", label: "Privacy", name: "Privacy policy" },
  { page: "terms", path: "/terms", label: "Terms", name: "Terms and conditions" },
  { page: "support", path: "/support", label: "Support", name: "Support" },
];

type SharePayload = { title?: string; text?: string; url?: string };

export function WebShell() {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const canGoBack = useRef(false);
  const skipLoadHaptic = useRef(true);
  const splashHidden = useRef(false);
  const lastShare = useRef(0);
  const lastTap = useRef(0);
  const loadFailed = useRef(false);
  const [edgeDrag] = useState(() => new Animated.Value(0));
  const showBackRef = useRef(false);
  const [offline, setOffline] = useState(false);
  const [webError, setWebError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [startUrl, setStartUrl] = useState(SITE_URL);
  const [navUrl, setNavUrl] = useState(SITE_URL);
  const [canBack, setCanBack] = useState(false);
  const [windowOpen, setWindowOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const [alertNote, setAlertNote] = useState("Off. Nothing is checked.");
  const page = pageFromUrl(navUrl);
  const showBack = windowOpen || canBack || (page !== "home" && page !== "other");

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const tap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 280) return;
    lastTap.current = now;
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

  const performBack = useCallback((): boolean => {
    const action = chooseBackAction({
      windowOpen,
      canGoBack: canGoBack.current,
      page,
      hasWebView: webRef.current != null,
      offline,
    });
    if (action === "window" && webRef.current) {
      tap();
      webRef.current.injectJavaScript(BACK_JS);
      return true;
    }
    if (action === "history" && webRef.current) {
      tap();
      webRef.current.goBack();
      return true;
    }
    if (action === "home") {
      tap();
      setWebError(false);
      if (webRef.current && !offline) {
        webRef.current.injectJavaScript(`window.location.assign(${JSON.stringify(SITE_URL + "/")}); true;`);
        return true;
      }
      setStartUrl(SITE_URL);
      if (!offline) setReloadKey((value) => value + 1);
      return !offline;
    }
    return false;
  }, [offline, page, tap, windowOpen]);

  const syncCanBack = useCallback(() => {
    const flag = showBackRef.current ? "true" : "false";
    webRef.current?.injectJavaScript(`window.__MVZ_CAN_BACK__=${flag}; true;`);
  }, []);

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
      let data: {
        type?: string;
        handled?: boolean;
        open?: boolean;
        title?: string;
        text?: string;
        url?: string;
        dx?: number;
        dy?: number;
        dt?: number;
      };
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
      } else if (data.type === "window") {
        setWindowOpen(data.open === true);
      } else if (data.type === "edge-move") {
        const dx = typeof data.dx === "number" ? data.dx : 0;
        edgeDrag.setValue(Math.max(0, Math.min(dx, 140)));
      } else if (data.type === "edge-cancel") {
        edgeDrag.setValue(0);
      } else if (data.type === "edge-end") {
        edgeDrag.setValue(0);
        const dx = typeof data.dx === "number" ? data.dx : 0;
        const dy = typeof data.dy === "number" ? data.dy : 0;
        const dt = typeof data.dt === "number" ? data.dt : 1;
        if (shouldCommitEdgeBack(dx, dy, dt, showBackRef.current)) performBack();
      } else if (data.type === "back") {
        if (data.handled) return;
        if (canGoBack.current) webRef.current?.goBack();
        else if (Platform.OS === "android") BackHandler.exitApp();
      }
    },
    [edgeDrag, performBack, shareFromSite, tap],
  );

  const openInApp = useCallback(
    (path: string) => {
      tap();
      const url = SITE_URL + path;
      setWebError(false);
      if (webRef.current && !offline) {
        webRef.current.injectJavaScript(`window.location.assign(${JSON.stringify(url)}); true;`);
        return;
      }
      setStartUrl(url);
      if (!offline) setReloadKey((value) => value + 1);
    },
    [offline, tap],
  );

  const onNav = useCallback((nav: WebViewNavigation) => {
    canGoBack.current = nav.canGoBack;
    setCanBack(nav.canGoBack);
    setNavUrl(nav.url);
    if (pageFromUrl(nav.url) !== "home") setWindowOpen(false);
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
      return performBack();
    });
    return () => sub.remove();
  }, [alertsOpen, offline, performBack, webError]);

  useEffect(() => {
    showBackRef.current = showBack;
    syncCanBack();
  }, [reloadKey, showBack, syncCanBack]);

  const onHttpError = useCallback(
    (event: WebViewHttpErrorEvent) => {
      if (event.nativeEvent.statusCode >= 400) {
        loadFailed.current = true;
        setWebError(true);
        hideSplash();
      }
    },
    [hideSplash],
  );

  const showOffline = offline || webError;
  const cueX = edgeDrag.interpolate({
    inputRange: [0, 120],
    outputRange: [-8, 36],
    extrapolate: "clamp",
  });
  const cueOpacity = edgeDrag.interpolate({
    inputRange: [0, 16, 72],
    outputRange: [0, 0.35, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.chrome,
          {
            paddingTop: insets.top + 4,
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12),
          },
        ]}
      >
        <View style={styles.topRow}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={windowOpen ? "Back to the radar" : "Back"}
              onPress={performBack}
              style={styles.back}
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : (
            <Text style={styles.brand} accessibilityRole="header">
              Movementizer
            </Text>
          )}
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
        <View style={styles.legalRow}>
          {LEGAL.map((item) => {
            const selected = page === item.page;
            return (
              <Pressable
                key={item.page}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                accessibilityState={{ selected }}
                onPress={() => openInApp(item.path)}
                style={[styles.legalBtn, selected && styles.legalBtnOn]}
              >
                <Text style={[styles.legalText, selected && styles.legalTextOn]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.body}>
      {showOffline ? (
        <OfflineScreen onRetry={retry} reason={offline ? "offline" : "error"} />
      ) : (
        <SiteView
          key={reloadKey}
          ref={webRef}
          source={{ uri: startUrl }}
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
          // Custom edge swipe replaces this. WKWebView's gesture only walks
          // history, so it cannot close a movement window, and running both
          // would step back twice on Privacy, Terms, and Support.
          allowsBackForwardNavigationGestures={false}
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
            loadFailed.current = false;
            if (skipLoadHaptic.current) {
              skipLoadHaptic.current = false;
              return;
            }
            tap();
          }}
          onLoadEnd={() => {
            hideSplash();
            syncCanBack();
            if (loadFailed.current) return;
            setWebError(false);
            void checkForStatusChanges();
          }}
          onError={(event) => {
            const code = event.nativeEvent.code;
            if (code === -999 || code === -3) return;
            loadFailed.current = true;
            setWebError(true);
            hideSplash();
          }}
          onHttpError={onHttpError}
          onContentProcessDidTerminate={() => {
            webRef.current?.reload();
          }}
        />
      )}
      {Platform.OS === "ios" ? (
        <Animated.View
          pointerEvents="none"
          accessible={false}
          style={[styles.cue, { opacity: cueOpacity, transform: [{ translateX: cueX }] }]}
        >
          <View style={styles.chevron} />
        </Animated.View>
      ) : null}
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
    paddingBottom: 8,
    gap: 8,
  },
  topRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  brand: {
    flex: 1,
    color: colors.cream,
    fontFamily: "Georgia",
    fontSize: 22,
  },
  back: {
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245,239,228,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "600",
  },
  legalRow: {
    flexDirection: "row",
    gap: 8,
  },
  legalBtn: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(245,239,228,0.22)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  legalBtnOn: {
    borderColor: "rgba(72,224,192,0.75)",
    backgroundColor: "rgba(72,224,192,0.12)",
  },
  legalText: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: "600",
  },
  legalTextOn: {
    color: colors.teal,
  },
  body: {
    flex: 1,
  },
  cue: {
    position: "absolute",
    left: 0,
    top: "42%",
    width: 36,
    height: 64,
    borderTopRightRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: "rgba(10,14,22,0.92)",
    borderWidth: 1,
    borderColor: "rgba(72,224,192,0.45)",
    zIndex: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  chevron: {
    width: 14,
    height: 14,
    marginLeft: 6,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.teal,
    transform: [{ rotate: "45deg" }],
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
