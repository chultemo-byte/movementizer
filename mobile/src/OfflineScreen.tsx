import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";

type Props = {
  onRetry: () => void;
};

export function OfflineScreen({ onRetry }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.radar} accessibilityElementsHidden>
        <View style={styles.ringOuter} />
        <View style={styles.ringInner} />
        <View style={styles.blip} />
      </View>
      <Text style={styles.title}>You are offline</Text>
      <Text style={styles.body}>The Earth radar needs a connection. Pull to refresh once you are back, or try again.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
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
    marginBottom: 10,
  },
  body: {
    color: colors.dim,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 320,
  },
  button: {
    marginTop: 28,
    minHeight: 48,
    minWidth: 140,
    paddingHorizontal: 22,
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
});
