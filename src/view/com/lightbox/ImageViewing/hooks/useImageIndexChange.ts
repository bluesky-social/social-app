/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useState } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

import { Dimensions } from "../@types";

const useImageIndexChange = (imageIndex: number, screen: Dimensions) => {
  const [currentImageIndex, setImageIndex] = useState(imageIndex);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {
      nativeEvent: {
        contentOffset: { x: scrollX },
      },
    } = event;

    if (screen.width) {
      const nextIndex = Math.round(scrollX / screen.width);
      setImageIndex(nextIndex < 0 ? 0 : nextIndex);
    }
  };

  return [currentImageIndex, onScroll] as const;
};

export default useImageIndexChange;
