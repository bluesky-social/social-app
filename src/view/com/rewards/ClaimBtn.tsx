import { StyleSheet, View } from "react-native";
import { colors, s } from "lib/styles";

import { StarsIcon } from "lib/icons";
import { Text } from "view/com/util/text/Text";
import { TouchableOpacity } from "react-native-gesture-handler";

type ClaimBtnProps = {
  onClick: () => void;
  text?: string;
  loading?: boolean;
  done?: boolean;
  disabled?: boolean;
  weekly?: boolean;
};

export const ClaimBtn = ({
  onClick,
  text = "Claim Reward",
  loading = false,
  disabled = false,
  done = false,
  weekly = false,
}: ClaimBtnProps) => {
  return (
    <TouchableOpacity
      disabled={disabled || loading || done}
      onPress={onClick}
      style={[
        weekly ? styles.claimWeeklyBtn : styles.claimDailyBtn,
        (disabled || loading || done) && { backgroundColor: colors.gray2 },
      ]}
    >
      <View style={styles.starIcon}>
        <StarsIcon fill={weekly ? "#2E008B" : "white"} />
      </View>
      <Text style={weekly ? styles.claimWeeklyText : styles.claimDailyText}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  claimDailyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: colors.splx.primary[50],
    marginTop: 4,
    marginBottom: 4,
  },
  claimWeeklyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: "#F8D55D",
    borderWidth: 1,
    borderColor: "#2E008B",

    marginTop: 4,
    marginBottom: 4,
  },
  starIcon: {
    marginRight: 8,
  },
  claimWeeklyText: {
    color: "#2E008B",
    fontSize: 12,
    fontWeight: "bold",
  },
  claimDailyText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
});
