var _a;
import { Dimensions, StyleSheet, } from 'react-native';
import { IS_WEB } from '#/env';
// 1 is lightest, 2 is light, 3 is mid, 4 is dark, 5 is darkest
/**
 * @deprecated use ALF colors instead
 */
export var colors = {
    white: '#ffffff',
    black: '#000000',
    gray1: '#F3F3F8',
    gray2: '#E2E2E4',
    gray3: '#B9B9C1',
    gray4: '#8D8E96',
    gray5: '#545664',
    gray6: '#373942',
    gray7: '#26272D',
    gray8: '#141417',
    blue0: '#bfe1ff',
    blue1: '#8bc7fd',
    blue2: '#52acfe',
    blue3: '#0085ff',
    blue4: '#0062bd',
    blue5: '#034581',
    blue6: '#012561',
    blue7: '#001040',
    red1: '#ffe6eb',
    red2: '#fba2b2',
    red3: '#ec4868',
    red4: '#d11043',
    red5: '#970721',
    red6: '#690419',
    red7: '#4F0314',
    pink1: '#f8ccff',
    pink2: '#e966ff',
    pink3: '#db00ff',
    pink4: '#a601c1',
    pink5: '#570066',
    purple1: '#ebdbff',
    purple2: '#ba85ff',
    purple3: '#9747ff',
    purple4: '#6d00fa',
    purple5: '#380080',
    green1: '#c1ffb8',
    green2: '#27f406',
    green3: '#20bc07',
    green4: '#148203',
    green5: '#082b03',
    unreadNotifBg: '#ebf6ff',
    brandBlue: '#0066FF',
    like: '#ec4899',
};
export var gradients = {
    blueLight: { start: '#5A71FA', end: colors.blue3 }, // buttons
    blue: { start: '#5E55FB', end: colors.blue3 }, // fab
    blueDark: { start: '#5F45E0', end: colors.blue3 }, // avis, banner
};
/**
 * @deprecated use atoms from `#/alf`
 */
export var s = StyleSheet.create((_a = {
        // helpers
        footerSpacer: { height: 100 },
        contentContainer: { paddingBottom: 200 },
        contentContainerExtra: { paddingBottom: 300 },
        border0: { borderWidth: 0 },
        border1: { borderWidth: 1 },
        borderTop1: { borderTopWidth: 1 },
        borderRight1: { borderRightWidth: 1 },
        borderBottom1: { borderBottomWidth: 1 },
        borderLeft1: { borderLeftWidth: 1 },
        hidden: { display: 'none' },
        dimmed: { opacity: 0.5 },
        // font weights
        fw600: { fontWeight: '600' },
        bold: { fontWeight: '600' },
        fw500: { fontWeight: '600' },
        semiBold: { fontWeight: '600' },
        fw400: { fontWeight: '400' },
        normal: { fontWeight: '400' },
        fw300: { fontWeight: '400' },
        light: { fontWeight: '400' },
        // text decoration
        underline: { textDecorationLine: 'underline' },
        // font variants
        tabularNum: { fontVariant: ['tabular-nums'] },
        // font sizes
        f9: { fontSize: 9 },
        f10: { fontSize: 10 },
        f11: { fontSize: 11 },
        f12: { fontSize: 12 },
        f13: { fontSize: 13 },
        f14: { fontSize: 14 },
        f15: { fontSize: 15 },
        f16: { fontSize: 16 },
        f17: { fontSize: 17 },
        f18: { fontSize: 18 }
    },
    // line heights
    _a['lh13-1'] = { lineHeight: 13 },
    _a['lh13-1.3'] = { lineHeight: 16.9 }, // 1.3 of 13px
    _a['lh14-1'] = { lineHeight: 14 },
    _a['lh14-1.3'] = { lineHeight: 18.2 }, // 1.3 of 14px
    _a['lh15-1'] = { lineHeight: 15 },
    _a['lh15-1.3'] = { lineHeight: 19.5 }, // 1.3 of 15px
    _a['lh16-1'] = { lineHeight: 16 },
    _a['lh16-1.3'] = { lineHeight: 20.8 }, // 1.3 of 16px
    _a['lh17-1'] = { lineHeight: 17 },
    _a['lh17-1.3'] = { lineHeight: 22.1 }, // 1.3 of 17px
    _a['lh18-1'] = { lineHeight: 18 },
    _a['lh18-1.3'] = { lineHeight: 23.4 }, // 1.3 of 18px
    // margins
    _a.mr2 = { marginRight: 2 },
    _a.mr5 = { marginRight: 5 },
    _a.mr10 = { marginRight: 10 },
    _a.mr20 = { marginRight: 20 },
    _a.ml2 = { marginLeft: 2 },
    _a.ml5 = { marginLeft: 5 },
    _a.ml10 = { marginLeft: 10 },
    _a.ml20 = { marginLeft: 20 },
    _a.mt2 = { marginTop: 2 },
    _a.mt5 = { marginTop: 5 },
    _a.mt10 = { marginTop: 10 },
    _a.mt20 = { marginTop: 20 },
    _a.mb2 = { marginBottom: 2 },
    _a.mb5 = { marginBottom: 5 },
    _a.mb10 = { marginBottom: 10 },
    _a.mb20 = { marginBottom: 20 },
    // paddings
    _a.p2 = { padding: 2 },
    _a.p5 = { padding: 5 },
    _a.p10 = { padding: 10 },
    _a.p20 = { padding: 20 },
    _a.pr2 = { paddingRight: 2 },
    _a.pr5 = { paddingRight: 5 },
    _a.pr10 = { paddingRight: 10 },
    _a.pr20 = { paddingRight: 20 },
    _a.pl2 = { paddingLeft: 2 },
    _a.pl5 = { paddingLeft: 5 },
    _a.pl10 = { paddingLeft: 10 },
    _a.pl20 = { paddingLeft: 20 },
    _a.pt2 = { paddingTop: 2 },
    _a.pt5 = { paddingTop: 5 },
    _a.pt10 = { paddingTop: 10 },
    _a.pt20 = { paddingTop: 20 },
    _a.pb2 = { paddingBottom: 2 },
    _a.pb5 = { paddingBottom: 5 },
    _a.pb10 = { paddingBottom: 10 },
    _a.pb20 = { paddingBottom: 20 },
    _a.px5 = { paddingHorizontal: 5 },
    // flex
    _a.flexRow = { flexDirection: 'row' },
    _a.flexCol = { flexDirection: 'column' },
    _a.flex1 = { flex: 1 },
    _a.flexGrow1 = { flexGrow: 1 },
    _a.alignCenter = { alignItems: 'center' },
    _a.alignBaseline = { alignItems: 'baseline' },
    _a.justifyCenter = { justifyContent: 'center' },
    // position
    _a.absolute = { position: 'absolute' },
    // dimensions
    _a.w100pct = { width: '100%' },
    _a.h100pct = { height: '100%' },
    _a.hContentRegion = IS_WEB ? { minHeight: '100%' } : { height: '100%' },
    _a.window = {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    // text align
    _a.textLeft = { textAlign: 'left' },
    _a.textCenter = { textAlign: 'center' },
    _a.textRight = { textAlign: 'right' },
    // colors
    _a.white = { color: colors.white },
    _a.black = { color: colors.black },
    _a.gray1 = { color: colors.gray1 },
    _a.gray2 = { color: colors.gray2 },
    _a.gray3 = { color: colors.gray3 },
    _a.gray4 = { color: colors.gray4 },
    _a.gray5 = { color: colors.gray5 },
    _a.blue1 = { color: colors.blue1 },
    _a.blue2 = { color: colors.blue2 },
    _a.blue3 = { color: colors.blue3 },
    _a.blue4 = { color: colors.blue4 },
    _a.blue5 = { color: colors.blue5 },
    _a.red1 = { color: colors.red1 },
    _a.red2 = { color: colors.red2 },
    _a.red3 = { color: colors.red3 },
    _a.red4 = { color: colors.red4 },
    _a.red5 = { color: colors.red5 },
    _a.pink1 = { color: colors.pink1 },
    _a.pink2 = { color: colors.pink2 },
    _a.pink3 = { color: colors.pink3 },
    _a.pink4 = { color: colors.pink4 },
    _a.pink5 = { color: colors.pink5 },
    _a.purple1 = { color: colors.purple1 },
    _a.purple2 = { color: colors.purple2 },
    _a.purple3 = { color: colors.purple3 },
    _a.purple4 = { color: colors.purple4 },
    _a.purple5 = { color: colors.purple5 },
    _a.green1 = { color: colors.green1 },
    _a.green2 = { color: colors.green2 },
    _a.green3 = { color: colors.green3 },
    _a.green4 = { color: colors.green4 },
    _a.green5 = { color: colors.green5 },
    _a.brandBlue = { color: colors.brandBlue },
    _a.likeColor = { color: colors.like },
    _a));
export function lh(theme, type, height) {
    return {
        lineHeight: Math.round((theme.typography[type].fontSize || 16) * height),
    };
}
export function addStyle(base, addedStyle) {
    if (Array.isArray(base)) {
        return base.concat([addedStyle]);
    }
    return [base, addedStyle];
}
