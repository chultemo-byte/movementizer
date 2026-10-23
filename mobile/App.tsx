import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { prepareNotifications } from "./src/alerts";
import { WebShell } from "./src/WebShell";

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

export default function App() {
  useEffect(() => {
    void prepareNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <WebShell />
    </SafeAreaProvider>
  );
}
