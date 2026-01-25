import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { View } from 'react-native';
// @ts-expect-error no type definition
import ProgressPie from 'react-native-progress/Pie';
import { clamp } from '#/lib/numbers';
import { atoms as a, useTheme } from '#/alf';
import { IS_WEB } from '#/env';
import { ExternalEmbedRemoveBtn } from '../ExternalEmbedRemoveBtn';
import { VideoTranscodeBackdrop } from './VideoTranscodeBackdrop';
export function VideoTranscodeProgress(_a) {
    var asset = _a.asset, progress = _a.progress, clear = _a.clear;
    var t = useTheme();
    if (IS_WEB)
        return null;
    var aspectRatio = asset.width / asset.height;
    if (isNaN(aspectRatio)) {
        aspectRatio = 16 / 9;
    }
    aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1);
    return (_jsxs(View, { style: [
            a.w_full,
            t.atoms.bg_contrast_50,
            a.rounded_md,
            a.overflow_hidden,
            { aspectRatio: aspectRatio },
        ], children: [_jsx(VideoTranscodeBackdrop, { uri: asset.uri }), _jsx(View, { style: [
                    a.flex_1,
                    a.align_center,
                    a.justify_center,
                    a.gap_lg,
                    a.absolute,
                    a.inset_0,
                ], children: _jsx(ProgressPie, { size: 48, borderWidth: 3, borderColor: t.atoms.text.color, color: t.atoms.text.color, progress: progress }) }), _jsx(ExternalEmbedRemoveBtn, { onRemove: clear })] }));
}
