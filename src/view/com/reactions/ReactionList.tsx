import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import { Text } from "../util/text/Text";
import { observer } from "mobx-react-lite";
import { s } from "lib/styles";
import { useStores } from "state/index";

export const ReactionList = observer(
  ({ reactions }: { reactions: string[] }) => {
    const store = useStores();

    return (
      <>
        {reactions?.map((item, index) => {
          if (
            // index < 9 &&
            (
              store.reactions.reactionTypes[item]?.nft_metadata?.image as string
            )?.includes("http")
          ) {
            return (
              <Image
                style={styles.image}
                key={store.reactions.reactionTypes[item]?.id}
                source={
                  store.reactions.reactionTypes[item]?.nft_metadata
                    ?.image as string
                }
              />
            );
          } else {
            return (
              <Text
                key={item}
                style={[s.f12, { marginLeft: index ? -6 : 0, zIndex: index }]}
              >
                {store.reactions.reactionTypes[item]?.nft_metadata?.image}
              </Text>
            );
          }
        })}
      </>
    );
  },
);

const styles = StyleSheet.create({
  image: {
    // width: '100%',
    // height: '100%',
    resizeMode: "contain",
    width: 25,
    height: 25,
    marginLeft: -15,
  },
});
