import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AcceptScreen } from "./src/AcceptScreen";
import { prepareNotifications } from "./src/alerts";
import { termsAreCurrent } from "./src/termsGate";
import { readAcceptedTerms } from "./src/termsStore";
import { WebShell } from "./src/WebShell";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function App() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    void prepareNotifications();
    let live = true;
    void readAcceptedTerms().then((stored) => {
      if (live) setAccepted(termsAreCurrent(stored));
    });
    return () => {
      live = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {accepted === true ? <WebShell /> : null}
      {accepted === false ? <AcceptScreen onAccepted={() => setAccepted(true)} /> : null}
    </SafeAreaProvider>
  );
}
