/*
 * Used ONLY by the web typecheck pass (tsconfig.check.web.json) - it is
 * excluded from the other passes and has no runtime effect.
 *
 * Under `moduleSuffixes: [".web", ""]`, react-native-svg's type entry
 * resolves to its DOM-flavored `ReactNativeSVG.web.d.ts`, a different API
 * surface (no SvgProps/PathProps, react-native-web style types) than the
 * native one the app is written against. At runtime the web build accepts
 * the same props, so this ambient declaration pins the package to its
 * native declarations for one coherent type surface across all passes.
 *
 * moduleSuffixes remaps even explicit `.d.ts` specifiers, so this mirrors
 * the package's ReactNativeSVG.d.ts + elements.d.ts via deep module paths
 * that have no `.web` siblings. Generated from react-native-svg 15.12.1.
 */
declare module 'react-native-svg' {
  import Shape from 'react-native-svg/lib/typescript/elements/Shape'
  import {
    RNSVGCircle,
    RNSVGClipPath,
    RNSVGDefs,
    RNSVGEllipse,
    RNSVGFeColorMatrix,
    RNSVGFeComposite,
    RNSVGFeGaussianBlur,
    RNSVGFeMerge,
    RNSVGFeOffset,
    RNSVGFilter,
    RNSVGForeignObject,
    RNSVGGroup,
    RNSVGImage,
    RNSVGLine,
    RNSVGLinearGradient,
    RNSVGMarker,
    RNSVGMask,
    RNSVGPath,
    RNSVGPattern,
    RNSVGRadialGradient,
    RNSVGRect,
    RNSVGSvgAndroid,
    RNSVGSvgIOS,
    RNSVGSymbol,
    RNSVGText,
    RNSVGTextPath,
    RNSVGTSpan,
    RNSVGUse,
  } from 'react-native-svg/lib/typescript/fabric'
  import {fetchText} from 'react-native-svg/lib/typescript/utils/fetchData'
  import {
    type AstProps,
    camelCase,
    type JsxAST,
    type Middleware,
    parse,
    type Styles,
    SvgAst,
    SvgFromUri,
    SvgFromXml,
    SvgUri,
    SvgXml,
    type UriProps,
    type UriState,
    type XmlAST,
    type XmlProps,
    type XmlState,
  } from 'react-native-svg/lib/typescript/xml'
  export {
    inlineStyles,
    loadLocalRawResource,
    LocalSvg,
    SvgCss,
    SvgCssUri,
    SvgWithCss,
    SvgWithCssUri,
    WithLocalSvg,
  } from 'react-native-svg/lib/typescript/deprecated'
  export type {CircleProps} from 'react-native-svg/lib/typescript/elements/Circle'
  export type {ClipPathProps} from 'react-native-svg/lib/typescript/elements/ClipPath'
  export type {EllipseProps} from 'react-native-svg/lib/typescript/elements/Ellipse'
  export type {FeBlendProps} from 'react-native-svg/lib/typescript/elements/filters/FeBlend'
  export type {FeColorMatrixProps} from 'react-native-svg/lib/typescript/elements/filters/FeColorMatrix'
  export type {FeComponentTransferProps} from 'react-native-svg/lib/typescript/elements/filters/FeComponentTransfer'
  export type {
    FeFuncAProps,
    FeFuncBProps,
    FeFuncGProps,
    FeFuncRProps,
  } from 'react-native-svg/lib/typescript/elements/filters/FeComponentTransferFunction'
  export type {FeCompositeProps} from 'react-native-svg/lib/typescript/elements/filters/FeComposite'
  export type {FeConvolveMatrixProps} from 'react-native-svg/lib/typescript/elements/filters/FeConvolveMatrix'
  export type {FeDiffuseLightingProps} from 'react-native-svg/lib/typescript/elements/filters/FeDiffuseLighting'
  export type {FeDisplacementMapProps} from 'react-native-svg/lib/typescript/elements/filters/FeDisplacementMap'
  export type {FeDistantLightProps} from 'react-native-svg/lib/typescript/elements/filters/FeDistantLight'
  export type {FeDropShadowProps} from 'react-native-svg/lib/typescript/elements/filters/FeDropShadow'
  export type {FeFloodProps} from 'react-native-svg/lib/typescript/elements/filters/FeFlood'
  export type {FeGaussianBlurProps} from 'react-native-svg/lib/typescript/elements/filters/FeGaussianBlur'
  export type {FeImageProps} from 'react-native-svg/lib/typescript/elements/filters/FeImage'
  export type {FeMergeProps} from 'react-native-svg/lib/typescript/elements/filters/FeMerge'
  export type {FeMergeNodeProps} from 'react-native-svg/lib/typescript/elements/filters/FeMergeNode'
  export type {FeMorphologyProps} from 'react-native-svg/lib/typescript/elements/filters/FeMorphology'
  export type {FeOffsetProps} from 'react-native-svg/lib/typescript/elements/filters/FeOffset'
  export type {FePointLightProps} from 'react-native-svg/lib/typescript/elements/filters/FePointLight'
  export type {FeSpecularLightingProps} from 'react-native-svg/lib/typescript/elements/filters/FeSpecularLighting'
  export type {FeSpotLightProps} from 'react-native-svg/lib/typescript/elements/filters/FeSpotLight'
  export type {FeTileProps} from 'react-native-svg/lib/typescript/elements/filters/FeTile'
  export type {FeTurbulenceProps} from 'react-native-svg/lib/typescript/elements/filters/FeTurbulence'
  export type {FilterProps} from 'react-native-svg/lib/typescript/elements/filters/Filter'
  export type {FilterPrimitiveCommonProps} from 'react-native-svg/lib/typescript/elements/filters/FilterPrimitive'
  export type {ForeignObjectProps} from 'react-native-svg/lib/typescript/elements/ForeignObject'
  export type {GProps} from 'react-native-svg/lib/typescript/elements/G'
  export type {ImageProps} from 'react-native-svg/lib/typescript/elements/Image'
  export type {LineProps} from 'react-native-svg/lib/typescript/elements/Line'
  export type {LinearGradientProps} from 'react-native-svg/lib/typescript/elements/LinearGradient'
  export type {MarkerProps} from 'react-native-svg/lib/typescript/elements/Marker'
  export type {MaskProps} from 'react-native-svg/lib/typescript/elements/Mask'
  export type {PathProps} from 'react-native-svg/lib/typescript/elements/Path'
  export type {PatternProps} from 'react-native-svg/lib/typescript/elements/Pattern'
  export type {PolygonProps} from 'react-native-svg/lib/typescript/elements/Polygon'
  export type {PolylineProps} from 'react-native-svg/lib/typescript/elements/Polyline'
  export type {RadialGradientProps} from 'react-native-svg/lib/typescript/elements/RadialGradient'
  export type {RectProps} from 'react-native-svg/lib/typescript/elements/Rect'
  export type {StopProps} from 'react-native-svg/lib/typescript/elements/Stop'
  export type {SvgProps} from 'react-native-svg/lib/typescript/elements/Svg'
  export type {SymbolProps} from 'react-native-svg/lib/typescript/elements/Symbol'
  export type {TextProps} from 'react-native-svg/lib/typescript/elements/Text'
  export type {TextPathProps} from 'react-native-svg/lib/typescript/elements/TextPath'
  export type {TSpanProps} from 'react-native-svg/lib/typescript/elements/TSpan'
  export type {UseProps} from 'react-native-svg/lib/typescript/elements/Use'
  export * from 'react-native-svg/lib/typescript/lib/extract/types'
  export {
    camelCase,
    fetchText,
    parse,
    RNSVGCircle,
    RNSVGClipPath,
    RNSVGDefs,
    RNSVGEllipse,
    RNSVGFeColorMatrix,
    RNSVGFeComposite,
    RNSVGFeGaussianBlur,
    RNSVGFeMerge,
    RNSVGFeOffset,
    RNSVGFilter,
    RNSVGForeignObject,
    RNSVGGroup,
    RNSVGImage,
    RNSVGLine,
    RNSVGLinearGradient,
    RNSVGMarker,
    RNSVGMask,
    RNSVGPath,
    RNSVGPattern,
    RNSVGRadialGradient,
    RNSVGRect,
    RNSVGSvgAndroid,
    RNSVGSvgIOS,
    RNSVGSymbol,
    RNSVGText,
    RNSVGTextPath,
    RNSVGTSpan,
    RNSVGUse,
    Shape,
    SvgAst,
    SvgFromUri,
    SvgFromXml,
    SvgUri,
    SvgXml,
  }
  export type {
    AstProps,
    JsxAST,
    Middleware,
    Styles,
    UriProps,
    UriState,
    XmlAST,
    XmlProps,
    XmlState,
  }
  import Circle from 'react-native-svg/lib/typescript/elements/Circle'
  import ClipPath from 'react-native-svg/lib/typescript/elements/ClipPath'
  import Defs from 'react-native-svg/lib/typescript/elements/Defs'
  import Ellipse from 'react-native-svg/lib/typescript/elements/Ellipse'
  import FeBlend from 'react-native-svg/lib/typescript/elements/filters/FeBlend'
  import FeColorMatrix from 'react-native-svg/lib/typescript/elements/filters/FeColorMatrix'
  import FeComponentTransfer from 'react-native-svg/lib/typescript/elements/filters/FeComponentTransfer'
  import {
    FeFuncA,
    FeFuncB,
    FeFuncG,
    FeFuncR,
  } from 'react-native-svg/lib/typescript/elements/filters/FeComponentTransferFunction'
  import FeComposite from 'react-native-svg/lib/typescript/elements/filters/FeComposite'
  import FeConvolveMatrix from 'react-native-svg/lib/typescript/elements/filters/FeConvolveMatrix'
  import FeDiffuseLighting from 'react-native-svg/lib/typescript/elements/filters/FeDiffuseLighting'
  import FeDisplacementMap from 'react-native-svg/lib/typescript/elements/filters/FeDisplacementMap'
  import FeDistantLight from 'react-native-svg/lib/typescript/elements/filters/FeDistantLight'
  import FeDropShadow from 'react-native-svg/lib/typescript/elements/filters/FeDropShadow'
  import FeFlood from 'react-native-svg/lib/typescript/elements/filters/FeFlood'
  import FeGaussianBlur from 'react-native-svg/lib/typescript/elements/filters/FeGaussianBlur'
  import FeImage from 'react-native-svg/lib/typescript/elements/filters/FeImage'
  import FeMerge from 'react-native-svg/lib/typescript/elements/filters/FeMerge'
  import FeMergeNode from 'react-native-svg/lib/typescript/elements/filters/FeMergeNode'
  import FeMorphology from 'react-native-svg/lib/typescript/elements/filters/FeMorphology'
  import FeOffset from 'react-native-svg/lib/typescript/elements/filters/FeOffset'
  import FePointLight from 'react-native-svg/lib/typescript/elements/filters/FePointLight'
  import FeSpecularLighting from 'react-native-svg/lib/typescript/elements/filters/FeSpecularLighting'
  import FeSpotLight from 'react-native-svg/lib/typescript/elements/filters/FeSpotLight'
  import FeTile from 'react-native-svg/lib/typescript/elements/filters/FeTile'
  import FeTurbulence from 'react-native-svg/lib/typescript/elements/filters/FeTurbulence'
  import Filter from 'react-native-svg/lib/typescript/elements/filters/Filter'
  import ForeignObject from 'react-native-svg/lib/typescript/elements/ForeignObject'
  import G from 'react-native-svg/lib/typescript/elements/G'
  import Image from 'react-native-svg/lib/typescript/elements/Image'
  import Line from 'react-native-svg/lib/typescript/elements/Line'
  import LinearGradient from 'react-native-svg/lib/typescript/elements/LinearGradient'
  import Marker from 'react-native-svg/lib/typescript/elements/Marker'
  import Mask from 'react-native-svg/lib/typescript/elements/Mask'
  import Path from 'react-native-svg/lib/typescript/elements/Path'
  import Pattern from 'react-native-svg/lib/typescript/elements/Pattern'
  import Polygon from 'react-native-svg/lib/typescript/elements/Polygon'
  import Polyline from 'react-native-svg/lib/typescript/elements/Polyline'
  import RadialGradient from 'react-native-svg/lib/typescript/elements/RadialGradient'
  import Rect from 'react-native-svg/lib/typescript/elements/Rect'
  import Stop from 'react-native-svg/lib/typescript/elements/Stop'
  import Svg from 'react-native-svg/lib/typescript/elements/Svg'
  import Symbol from 'react-native-svg/lib/typescript/elements/Symbol'
  import Text from 'react-native-svg/lib/typescript/elements/Text'
  import TextPath from 'react-native-svg/lib/typescript/elements/TextPath'
  import TSpan from 'react-native-svg/lib/typescript/elements/TSpan'
  import Use from 'react-native-svg/lib/typescript/elements/Use'
  export {
    Circle,
    ClipPath,
    Defs,
    Ellipse,
    FeBlend,
    FeColorMatrix,
    FeComponentTransfer,
    FeComposite,
    FeConvolveMatrix,
    FeDiffuseLighting,
    FeDisplacementMap,
    FeDistantLight,
    FeDropShadow,
    FeFlood,
    FeFuncA,
    FeFuncB,
    FeFuncG,
    FeFuncR,
    FeGaussianBlur,
    FeImage,
    FeMerge,
    FeMergeNode,
    FeMorphology,
    FeOffset,
    FePointLight,
    FeSpecularLighting,
    FeSpotLight,
    FeTile,
    FeTurbulence,
    Filter,
    ForeignObject,
    G,
    Image,
    Line,
    LinearGradient,
    Marker,
    Mask,
    Path,
    Pattern,
    Polygon,
    Polyline,
    RadialGradient,
    Rect,
    Stop,
    Svg,
    Symbol,
    Text,
    TextPath,
    TSpan,
    Use,
  }
  export default Svg
}
