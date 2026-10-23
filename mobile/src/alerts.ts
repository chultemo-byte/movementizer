import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import {
  diffStatuses,
  notificationBody,
  parseMovementStatuses,
  type Snapshot,
} from "./movementStatus";
import { SITE_URL } from "./navigationPolicy";

const ENABLED_KEY = "movementizer.alerts.enabled";
const SNAPSHOT_KEY = "movementizer.alerts.snapshot";
const CHANNEL_ID = "movement-windows";

let lastCheck = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function prepareNotifications(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Movement windows",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function alertsEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(ENABLED_KEY)) === "1";
}

export async function notificationsAllowed(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return permissionGranted(settings);
}

export async function enableAlerts(): Promise<"on" | "denied"> {
  await prepareNotifications();
  const existing = await Notifications.getPermissionsAsync();
  let granted = permissionGranted(existing);
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = permissionGranted(requested);
  }
  if (!granted) {
    await AsyncStorage.setItem(ENABLED_KEY, "0");
    return "denied";
  }
  await AsyncStorage.setItem(ENABLED_KEY, "1");
  const baseline = await readRadar();
  if (baseline) await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(baseline));
  lastCheck = Date.now();
  return "on";
}

export async function disableAlerts(): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, "0");
}

export async function checkForStatusChanges(): Promise<string | null> {
  if (!(await alertsEnabled())) return null;
  if (!(await notificationsAllowed())) return null;
  const now = Date.now();
  if (now - lastCheck < 4000) return null;
  lastCheck = now;
  const next = await readRadar();
  if (!next) return null;
  const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
  await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
  if (!raw) return null;
  let previous: Snapshot;
  try {
    previous = JSON.parse(raw) as Snapshot;
  } catch {
    return null;
  }
  const body = notificationBody(diffStatuses(previous, next));
  if (!body) return null;
  await Notifications.scheduleNotificationAsync({
    content: { title: "Movementizer", body },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
  });
  return body;
}

async function readRadar(): Promise<Snapshot | null> {
  try {
    const response = await fetch(SITE_URL, { headers: { Accept: "text/html" } });
    if (!response.ok) return null;
    const snapshot = parseMovementStatuses(await response.text());
    return Object.keys(snapshot).length >= 5 ? snapshot : null;
  } catch {
    return null;
  }
}

function permissionGranted(settings: Notifications.NotificationPermissionsStatus): boolean {
  if (Platform.OS === "ios") {
    const status = settings.ios?.status;
    return (
      status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      status === Notifications.IosAuthorizationStatus.EPHEMERAL
    );
  }
  return settings.status === "granted";
}
