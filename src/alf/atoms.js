var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { atoms as baseAtoms } from '@bsky.app/alf';
import { CARD_ASPECT_RATIO } from '#/lib/constants';
import { native, platform, web } from '#/alf/util/platform';
import * as Layout from '#/components/Layout';
var EXP_CURVE = 'cubic-bezier(0.16, 1, 0.3, 1)';
export var atoms = __assign(__assign({}, baseAtoms), { h_full_vh: web({
        height: '100vh',
    }), 
    /**
     * Used for the outermost components on screens, to ensure that they can fill
     * the screen and extend beyond.
     */
    util_screen_outer: [
        web({
            minHeight: '100vh',
        }),
        native({
            height: '100%',
        }),
    ], 
    /*
     * Theme-independent bg colors
     */
    bg_transparent: {
        backgroundColor: 'transparent',
    }, 
    /**
     * Aspect ratios
     */
    aspect_square: {
        aspectRatio: 1,
    }, aspect_card: {
        aspectRatio: CARD_ASPECT_RATIO,
    }, 
    /*
     * Transition
     */
    transition_none: web({
        transitionProperty: 'none',
    }), transition_timing_default: web({
        transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
        transitionDuration: '100ms',
    }), transition_all: web({
        transitionProperty: 'all',
        transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
        transitionDuration: '100ms',
    }), transition_color: web({
        transitionProperty: 'color, background-color, border-color, text-decoration-color, fill, stroke',
        transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
        transitionDuration: '100ms',
    }), transition_opacity: web({
        transitionProperty: 'opacity',
        transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
        transitionDuration: '100ms',
    }), transition_transform: web({
        transitionProperty: 'transform',
        transitionTimingFunction: 'cubic-bezier(0.17, 0.73, 0.14, 1)',
        transitionDuration: '100ms',
    }), transition_delay_50ms: web({
        transitionDelay: '50ms',
    }), 
    /*
     * Animations
     */
    fade_in: web({
        animation: 'fadeIn ease-out 0.15s',
    }), fade_out: web({
        animation: 'fadeOut ease-out 0.15s',
        animationFillMode: 'forwards',
    }), zoom_in: web({
        animation: 'zoomIn ease-out 0.1s',
    }), zoom_out: web({
        animation: 'zoomOut ease-out 0.1s',
    }), slide_in_left: web({
        // exponential easing function
        animation: 'slideInLeft cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
    }), slide_out_left: web({
        animation: 'slideOutLeft ease-in 0.15s',
        animationFillMode: 'forwards',
    }), 
    // special composite animation for dialogs
    zoom_fade_in: web({
        animation: "zoomIn ".concat(EXP_CURVE, " 0.3s, fadeIn ").concat(EXP_CURVE, " 0.3s"),
    }), 
    /**
     * Visually hidden but available to screen readers (web).
     * Use for live regions or off-screen labels (e.g. "Image 1 of 3").
     */
    sr_only: web({
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0,0,0,0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
    }), 
    /**
     * {@link Layout.SCROLLBAR_OFFSET}
     */
    scrollbar_offset: platform({
        web: {
            transform: [
                {
                    translateX: Layout.SCROLLBAR_OFFSET,
                },
            ],
        },
        native: {
            transform: [],
        },
    }) });
