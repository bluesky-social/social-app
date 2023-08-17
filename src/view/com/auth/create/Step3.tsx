import { StyleSheet, View } from "react-native";

import { CreateAccountModel } from "state/models/ui/create-account";
import { ErrorMessage } from "view/com/util/error/ErrorMessage";
import { Policies } from "./Policies";
import React from "react";
import { StepHeader } from "./StepHeader";
import { Text } from "view/com/util/text/Text";
import { TextInput } from "../util/TextInput";
import { createFullHandle } from "lib/strings/handles";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { usePalette } from "lib/hooks/usePalette";

export const Step3 = observer(({ model }: { model: CreateAccountModel }) => {
  const pal = usePalette("default");
  return (
    <View>
      {/* <StepHeader step="3" title="Your user handle" /> */}
      <View style={s.pb10}>
        <Text type="md-medium" style={[pal.text, s.mb2]} nativeID="birthDate">
          Your username
        </Text>
        <TextInput
          testID="handleInput"
          icon="at"
          placeholder="e.g. alice"
          value={model.handle}
          editable
          onChange={model.setHandle}
          // TODO: Add explicit text label
          accessibilityLabel="User handle"
          accessibilityHint="Input your user handle"
        />
        <Text type="lg" style={[pal.text, s.pl5, s.pt10]}>
          Your handle will be{" "}
          <Text type="lg-bold" style={pal.text}>
            @{createFullHandle(model.handle, model.userDomain)}
          </Text>
        </Text>
      </View>
      {/* {model.error ? (
        <ErrorMessage message={model.error} style={styles.error} />
      ) : undefined} */}
      {model.serviceDescription && (
        <Policies
          serviceDescription={model.serviceDescription}
          needsGuardian={!model.isAge18}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  error: {
    borderRadius: 6,
  },
});
