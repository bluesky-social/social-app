import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { CreateAccountModel } from "state/models/ui/create-account";
import { NavigationProp } from "lib/routes/types";
import React from "react";
import { Step1 } from "./Step1";
import { Step2 } from "./Step2";
import { Step3 } from "./Step3";
import { Text } from "../../util/text/Text";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { useAnalytics } from "lib/analytics/analytics";
import { useNavigation } from "@react-navigation/native";
import { usePalette } from "lib/hooks/usePalette";
import { useStores } from "state/index";

export const CreateAccount = observer(
  ({ onPressBack }: { onPressBack: () => void }) => {
    const { track, screen } = useAnalytics();
    const pal = usePalette("default");
    const store = useStores();
    const model = React.useMemo(() => new CreateAccountModel(store), [store]);
    const navigation = useNavigation<NavigationProp>();

    React.useEffect(() => {
      screen("CreateAccount");
    }, [screen]);

    React.useEffect(() => {
      model.fetchServiceDescription();
    }, [model]);

    const onPressRetryConnect = React.useCallback(
      () => model.fetchServiceDescription(),
      [model],
    );

    const onPressBackInner = React.useCallback(() => {
      onPressBack();
    }, [model, onPressBack]);

    const onPressNext = React.useCallback(async () => {
      if (!model.canNext) {
        return;
      }
      if (model.step < 3) {
        model.next();
      } else {
        try {
          await model.submit();
          navigation.navigate("Home");
        } catch {
          // dont need to handle here
        } finally {
          track("Try Create Account");
        }
      }
    }, [model, track]);

    return (
      <ScrollView testID="createAccount" style={pal.view}>
        <KeyboardAvoidingView behavior="padding">
          <View style={styles.stepContainer}>
            {/* {model.step === 1 && <Step1 model={model} />} */}
            {model.step === 3 && <Step2 model={model} />}
            {model.step === 3 && <Step3 model={model} />}
          </View>
          <View style={[s.flexRow, s.pl20, s.pr20]}>
            <TouchableOpacity
              onPress={onPressBackInner}
              testID="backBtn"
              accessibilityRole="button"
            >
              <Text type="xl" style={pal.link}>
                Back
              </Text>
            </TouchableOpacity>
            <View style={s.flex1} />
            {model.canNext ? (
              <TouchableOpacity
                testID="nextBtn"
                onPress={onPressNext}
                accessibilityRole="button"
              >
                {model.isProcessing ? (
                  <ActivityIndicator />
                ) : (
                  <Text type="xl-bold" style={[pal.link, s.pr5]}>
                    Next
                  </Text>
                )}
              </TouchableOpacity>
            ) : model.didServiceDescriptionFetchFail ? (
              <TouchableOpacity
                testID="retryConnectBtn"
                onPress={onPressRetryConnect}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                accessibilityHint="Retries account creation"
                accessibilityLiveRegion="polite"
              >
                <Text type="xl-bold" style={[pal.link, s.pr5]}>
                  Retry
                </Text>
              </TouchableOpacity>
            ) : model.isFetchingServiceDescription ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text type="xl" style={[pal.text, s.pr5]}>
                  Connecting...
                </Text>
              </>
            ) : undefined}
          </View>
          <View style={s.footerSpacer} />
        </KeyboardAvoidingView>
      </ScrollView>
    );
  },
);

const styles = StyleSheet.create({
  stepContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});
