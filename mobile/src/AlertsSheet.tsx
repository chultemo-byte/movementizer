import { StyleSheet, Switch, Text, View } from "react-native";
import { colors } from "./theme";

type Props = {
  enabled: boolean;
  note: string;
  onChange: (next: boolean) => void;
};

export function AlertsSheet({ enabled, note, onChange }: Props) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title} accessibilityRole="header">
        Alerts
      </Text>
      <Text style={styles.body}>
        Off by default. When this is on, Movementizer reads the public radar each time you open the app. If a window has moved between Live, Still on, and Fulfilled, this phone shows a notification.
      </Text>
      <Text style={styles.body}>
        The list stays on this device. There is no server sending alerts, and nothing is checked while the app is closed.
      </Text>
      <View style={styles.row}>
        <Text style={styles.label}>{enabled ? "On" : "Off"}</Text>
        <Switch
          accessibilityLabel="Movement window alerts"
          value={enabled}
          onValueChange={onChange}
          trackColor={{ false: "#2a3344", true: "rgba(72,224,192,0.45)" }}
          thumbColor={enabled ? colors.teal : colors.cream}
        />
      </View>
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 22,
    paddingTop: 22,
  },
  title: {
    color: colors.cream,
    fontFamily: "Georgia",
    fontSize: 32,
    lineHeight: 36,
    marginBottom: 10,
  },
  body: {
    color: colors.dim,
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 10,
  },
  row: {
    marginTop: 8,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: "600",
  },
  note: {
    color: colors.gold,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    minHeight: 20,
  },
});
