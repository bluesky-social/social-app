import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Trans } from '@lingui/macro';
import { useRequireEmailVerification } from '#/lib/hooks/useRequireEmailVerification';
import { useOpenComposer as useRootOpenComposer } from '#/state/shell/composer';
export function useOpenComposer() {
    var openComposer = useRootOpenComposer().openComposer;
    var requireEmailVerification = useRequireEmailVerification();
    return useMemo(function () {
        return {
            openComposer: requireEmailVerification(openComposer, {
                instructions: [
                    _jsx(Trans, { children: "Before creating a post or replying, you must first verify your email." }, "pre-compose"),
                ],
            }),
        };
    }, [openComposer, requireEmailVerification]);
}
