import { useCallback, useEffect, useState, type ComponentType, type RefAttributes } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, type WebViewProps } from "react-native-webview";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";
import * as Haptics from "expo-haptics";
import * as SplashScreen from "expo-splash-screen";
import { decideNavigation, pageFromUrl, SITE_URL } from "./navigationPolicy";
import { TERMS_EFFECTIVE } from "./termsGate";
import { acceptCurrentTerms } from "./termsStore";
import { colors } from "./theme";

const SiteView = WebView as unknown as ComponentType<WebViewProps & RefAttributes<WebView>>;

type Reading = "terms" | "privacy";

type Props = {
  onAccepted: () => void;
};

export function AcceptScreen({ onAccepted }: Props) {
  const insets = useSafeAreaInsets();
  const [reading, setReading] = useState<Reading | null>(null);
  const [readError, setReadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (reading) {
        setReading(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [reading]);

  const openPage = useCallback((page: Reading) => {
    setReadError(false);
    setReading(page);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, []);

  const onShouldStart = useCallback((request: ShouldStartLoadRequest) => {
    const decision = decideNavigation(request.url, request.isTopFrame, request.mainDocumentURL);
    if (decision === "external") {
      Linking.openURL(request.url).catch(() => {});
      return false;
    }
    if (decision !== "allow") return false;
    if (request.isTopFrame !== false && pageFromUrl(request.url) === "home") {
      setReading(null);
      return false;
    }
    return true;
  }, []);

  const agree = useCallback(() => {
    if (saving) return;
    setSaving(true);
    setNote("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void acceptCurrentTerms()
      .then(() => onAccepted())
      .catch(() => {
        setSaving(false);
        setNote("Could not save on this phone. Try again.");
      });
  }, [onAccepted, saving]);

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
        {reading ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to the agreement"
            onPress={() => setReading(null)}
            style={styles.back}
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : (
          <Text style={styles.brand} accessibilityRole="header">
            Movementizer
          </Text>
        )}
      </View>
      {reading ? (
        <View style={styles.body}>
          {readError ? (
            <View style={styles.miss}>
              <Text style={styles.missTitle}>The page did not load</Text>
              <Text style={styles.missBody}>Check the connection, then come back and try the link again.</Text>
            </View>
          ) : (
            <SiteView
              source={{ uri: SITE_URL + "/" + reading }}
              style={styles.web}
              originWhitelist={["https://*", "http://*", "about:*"]}
              onShouldStartLoadWithRequest={onShouldStart}
              onOpenWindow={(event) => {
                Linking.openURL(event.nativeEvent.targetUrl).catch(() => {});
              }}
              setSupportMultipleWindows={false}
              allowsBackForwardNavigationGestures
              allowsInlineMediaPlayback
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator color={colors.teal} />
                </View>
              )}
              onLoadStart={() => setReadError(false)}
              onError={(event) => {
                const code = event.nativeEvent.code;
                if (code === -999 || code === -3) return;
                setReadError(true);
              }}
            />
          )}
        </View>
      ) : (
        <View style={[styles.welcome, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.radar} accessibilityElementsHidden>
            <View style={styles.ringOuter} />
            <View style={styles.ringInner} />
            <View style={styles.blip} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            Earth radar
          </Text>
          <Text style={styles.bodyCopy}>Read the terms and the privacy policy before you open the radar.</Text>
          <View style={styles.links}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Terms"
              onPress={() => openPage("terms")}
              style={styles.linkBtn}
            >
              <Text style={styles.link}>Terms</Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Privacy policy"
              onPress={() => openPage("privacy")}
              style={styles.linkBtn}
            >
              <Text style={styles.link}>Privacy</Text>
            </Pressable>
          </View>
          <Text style={styles.fine}>
            Your agreement stays on this phone. If the terms change, this screen comes back. Effective {TERMS_EFFECTIVE}.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="I agree"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={agree}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, saving && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>{saving ? "Saving" : "I agree"}</Text>
          </Pressable>
          {note ? <Text style={styles.note}>{note}</Text> : null}
        </View>
      )}
      {reading ? <View style={{ height: insets.bottom }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  chrome: {
    minHeight: 44,
    paddingBottom: 8,
    justifyContent: "center",
  },
  brand: {
    color: colors.cream,
    fontFamily: "Georgia",
    fontSize: 22,
    paddingHorizontal: 8,
  },
  back: {
    alignSelf: "flex-start",
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
  welcome: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  radar: {
    width: 148,
    height: 148,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ringOuter: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: colors.teal,
  },
  ringInner: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: "rgba(72,224,192,0.55)",
  },
  blip: {
    position: "absolute",
    top: 28,
    right: 36,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.coral,
  },
  title: {
    color: colors.cream,
    fontSize: 32,
    lineHeight: 36,
    fontFamily: "Georgia",
    marginBottom: 12,
  },
  bodyCopy: {
    color: colors.dim,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 340,
  },
  links: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  linkBtn: {
    minHeight: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  link: {
    color: colors.teal,
    fontSize: 17,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  fine: {
    color: colors.dim,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 340,
    marginTop: 14,
  },
  button: {
    marginTop: 28,
    minHeight: 48,
    minWidth: 168,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    backgroundColor: "rgba(72,224,192,0.12)",
  },
  buttonText: {
    color: colors.teal,
    fontSize: 17,
    fontWeight: "600",
  },
  note: {
    color: colors.gold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 320,
  },
  miss: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  missTitle: {
    color: colors.cream,
    fontFamily: "Georgia",
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 10,
    textAlign: "center",
  },
  missBody: {
    color: colors.dim,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
  },
});
