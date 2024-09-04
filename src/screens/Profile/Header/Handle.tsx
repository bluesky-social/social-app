import React, { useState } from 'react';
import {View, TouchableOpacity} from 'react-native';
import {AppBskyActorDefs} from '@atproto/api';
import {Trans} from '@lingui/macro';

import {Shadow} from '#/state/cache/types';
import {isInvalidHandle} from 'lib/strings/handles';
import {isIOS} from 'platform/detection';
import {atoms as a, useTheme, web} from '#/alf';
import {NewskieDialog} from '#/components/NewskieDialog';
import {Text} from '#/components/Typography';

export function ProfileHeaderHandle({
  profile,
  disableTaps,
}: {
  profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>
  disableTaps?: boolean
}) {
  const [showFullHandle, setShowFullHandle] = useState(false);
  const t = useTheme();
  const invalidHandle = isInvalidHandle(profile.handle);
  const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy;

  // Condition to check the domain
  const isDefaultDomain = profile.handle.endsWith('.bsky.social');

  // Function to determine which handle to display based on state and domain
  const handleText = showFullHandle || !isDefaultDomain ? `@${profile.handle}` : `@${profile.handle.split('.')[0]}`;

  const toggleHandleDisplay = () => setShowFullHandle(!showFullHandle);

  return (
    <View
      style={[a.flex_row, a.gap_xs, a.align_center]}
      pointerEvents={disableTaps ? 'none' : isIOS ? 'auto' : 'box-none'}>
      <NewskieDialog profile={profile} disabled={disableTaps} />
      {profile.viewer?.followedBy && !blockHide ? (
        <View style={[t.atoms.bg_contrast_25, a.rounded_xs, a.px_sm, a.py_xs]}>
          <Text style={[t.atoms.text, a.text_sm]}>
            <Trans>Follows you</Trans>
          </Text>
        </View>
      ) : undefined}
      <TouchableOpacity onPress={toggleHandleDisplay}>
        <Text
          numberOfLines={1}
          style={[
            invalidHandle
              ? [
                  a.border,
                  a.text_xs,
                  a.px_sm,
                  a.py_xs,
                  a.rounded_xs,
                  {borderColor: t.palette.contrast_200},
                ]
              : [a.text_md, a.leading_tight, t.atoms.text_contrast_medium],
            web({wordBreak: 'break-all'}),
          ]}>
          {invalidHandle ? <Trans>⚠Invalid Handle</Trans> : handleText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
