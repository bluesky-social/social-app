import { StyleSheet, View } from "react-native";

import { CheckIcon } from "lib/icons";
import { Text } from "../util/text/Text";
import { s } from "lib/styles";

type Day = {
  day: number;
  isCompleted: boolean;
};

export const Day = ({ day, isCompleted }: Day) => (
  <View
    style={[
      styles.daybox,
      isCompleted ? styles.dayContentChecked : styles.dayContentText,
    ]}
  >
    {isCompleted ? (
      <View>
        <CheckIcon />
      </View>
    ) : (
      <Text style={styles.text}>{day}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  daybox: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    width: 8,
    height: 8,
    padding: 10,
    marginHorizontal: 2,
  },
  dayContentText: {
    backgroundColor: s.gray3.color,
  },
  dayContentChecked: {
    backgroundColor: "transparent",
  },
  text: {
    color: "white",
  },
});
