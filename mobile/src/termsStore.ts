import AsyncStorage from "@react-native-async-storage/async-storage";
import { TERMS_VERSION } from "./termsGate";

const KEY = "movementizer.termsAccepted";

export async function readAcceptedTerms(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function acceptCurrentTerms(): Promise<void> {
  await AsyncStorage.setItem(KEY, TERMS_VERSION);
}
