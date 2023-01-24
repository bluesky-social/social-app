import * as rn from "react-native";

declare module "react-native" {
  class VirtualizedList<ItemT> extends React.Component<
    VirtualizedListProps<ItemT>
  > {}
}
