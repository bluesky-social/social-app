import { useEffect } from "react";
import {
  Platform,
  ModalProps,
  StatusBar,
} from "react-native";

const StatusBarManager = ({
  presentationStyle,
}: {
  presentationStyle?: ModalProps["presentationStyle"];
}) => {
  if (Platform.OS === "ios" || presentationStyle !== "overFullScreen") {
    return null;
  }

  //Can't get an actual state of app status bar with default RN. Gonna rely on "presentationStyle === overFullScreen" prop and guess application status bar state to be visible in this case.
  StatusBar.setHidden(true);

  useEffect(() => {
    return () => StatusBar.setHidden(false);
  }, []);

  return null;
};

export default StatusBarManager;
