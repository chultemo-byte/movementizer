import { Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "./theme";

type Props = {
  visible: boolean;
  enabled: boolean;
  note: string;
  onClose: () => void;
  onChange: (next: boolean) => void;
};

export function AlertsSheet({ visible, enabled, note, onClose, onChange }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close alerts">
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
          onPress={() => {}}
        >
          <Text style={styles.title}>Alerts</Text>
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
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4,6,10,0.72)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#121a28",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
    borderTopWidth: 1,
    borderColor: colors.line,
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
  close: {
    marginTop: 16,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  closeText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "600",
  },
});
