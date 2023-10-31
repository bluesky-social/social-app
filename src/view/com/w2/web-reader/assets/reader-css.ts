// This file is generated automatically
// To regenerate, see: news-crawl/embedded-reader/README.md
import {Platform} from 'react-native'
import {resetCss} from './reset-css'

type FontFormats = 'ttf' | 'otf'

export const generateAssetsFontCss = (
  fontFamily: string,
  fontFile?: string,
  fontStyle?: string,
  fileFormat: FontFormats = 'ttf',
) => {
  const actualFontFile = fontFile ? fontFile : fontFamily

  const fileName = Platform.select({
    ios: `${actualFontFile}.${fileFormat}`,
    android: `file:///android_asset/fonts/${actualFontFile}.${fileFormat}`,
  })

  const fontStyleCss = fontStyle ? `font-style: ${fontStyle}` : ''
  const formatName = fileFormat === 'ttf' ? 'truetype' : 'opentype'

  return /* css */ `
	  @font-face {
     	font-family: '${fontFamily}';
      src: local('${actualFontFile}'), url('${fileName}') format('${formatName}');
      ${fontStyleCss}
	  }
	`
}

export interface ReaderTheme {
  background: string
  backgroundLight: string
  text: string
  textLight: string
  highlight: string
}

export const readerCss = (theme: ReaderTheme) => /* css */ `
  ${generateAssetsFontCss('NewYork')}
  ${generateAssetsFontCss('NewYork', 'NewYorkItalic', 'italic')}
  ${generateAssetsFontCss('SF-Pro')}

  ${resetCss}

  :root {
    --background: ${theme.background};
    --background-light: ${theme.backgroundLight};
    --text: ${theme.text};
    --text-light: ${theme.textLight};
    --highlight: ${theme.highlight};

    --default-font: 'NewYork';
    --heading-font: 'SF-Pro';
    --monospace-font: 'Courier';

    --default-font-size: 13.5pt;
    --default-line-height: 21pt;
    --monospace-font-size: 95%;
    --small-font-size: 10.5pt;
    --small-line-height: 14.5pt;
    --pre-font-size: 10pt;
    --pre-line-height: 13pt;

    --paragraph-spacing: 15pt;
    --small-padding: 4pt;

    --text-margins: 16px;
  }


  /* Vertical paragraph styles */

  html {
    font-family: var(--default-font);
    background-color: var(--background);
    color: var(--text);
  }

  p, blockquote, ul, ol, dl {
    font-size: var(--default-font-size);
    line-height: var(--default-line-height);
    margin-bottom: var(--paragraph-spacing);
    margin-left: var(--text-margins);
    margin-right: var(--text-margins);
  }

  table, table p, table blockquote, table ul, table ol, table dl
  {
    font-size: calc(var(--default-font-size) - 2pt);
    line-height: calc(var(--default-line-height) - 2pt);
  }

  pre, pre p, pre blockquote, pre ul, pre ol, pre dl, pre code, pre kbd, pre samp {
    font-family: var(--monospace-font);
    font-size: var(--pre-font-size);
    line-height: var(--pre-line-height);
  }

  /* List styles */
  ul {
    margin-left: calc(var(--text-margins) + 12pt); /* Align with center of first letter of regular paragraphs */
    list-style-type: '∙\\2000';
    padding: 0;
  }

  ul ul {
    margin-left: 12pt; /* Align with center of first letter of previous level */
    list-style-type: '⁃\\2000';
  }

  ol {
    margin-left: calc(var(--text-margins) + 30pt); /* Allows for 2-digit numbers */
    padding: 0;
  }

  ol ol {
    margin-left: 20pt; /* Second and subsequent levels dont need space for 2 digit */
  }

  dd {
    margin-left: calc(var(--text-margins) + 30pt);
  }

  li, li p {
    margin-bottom: calc(var(--paragraph-spacing) / 2);
  }

  li p:last-child {
    margin-bottom: 0;
  }

  li > ul, li > ol {
    margin-top: calc(var(--paragraph-spacing) / 2);
  }

  small {
    font-size: var(--small-font-size);
  }


  /* Styling spans */

  b, strong, summary, th {
    font-weight: 550;
  }

  em, i, dfn, q, var, cite {
    font-style: italic;
  }

  a {
    color: var(--text);
    text-decoration: underline;
  }

  /* We add the __DISABLED_ANCHOR class to invalid anchors, render them like span */
  a.__DISABLED_ANCHOR {
    text-decoration: none;
    pointer-events: none;
  }

  u {
    text-decoration: underline;
  }

  sub, sup {
    font-size: 60%;
    line-height: 60%;
  }

  ins {
    background-color: var(--background-light);
  }

  mark {  /* Medium uses 'mark' to highlight text, it looks ugly, disable it. */
    background-color: transparent;
  }

  del, s {
    color: var(--text);
    text-decoration: underline;
  }

  center { /* Ignore the center element, it makes everything ugly */
    text-align: left;
  }


  /* Headers */
  /* Headers are more compact and have a smaller line-height */

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--heading-font);
  }

  h1 {
    margin: calc(var(--paragraph-spacing) + 5.5pt) var(--text-margins) calc(var(--paragraph-spacing) - 8.5pt);
    font-size: calc(var(--default-font-size) + 3.5pt);
    line-height: calc(var(--default-font-size) + 6.5pt);
    letter-spacing: -0.35px;
    font-weight: 600;
  }

  h2 {
    margin: calc(var(--paragraph-spacing) + 5pt) var(--text-margins) calc(var(--paragraph-spacing) - 8pt);
    font-size: calc(var(--default-font-size) + 3pt);
    line-height: calc(var(--default-font-size) + 6pt);
    letter-spacing: -0.35px;
    font-weight: 600;
  }

  h3 {
    margin: calc(var(--paragraph-spacing) + 4.5pt) var(--text-margins) calc(var(--paragraph-spacing) - 7.5pt);
    font-size: calc(var(--default-font-size) + 2pt);
    line-height: calc(var(--default-font-size) + 5pt);
    letter-spacing: -0.35px;
    font-weight: 600;
  }

  h4 {
    margin: calc(var(--paragraph-spacing) + 4pt) var(--text-margins) calc(var(--paragraph-spacing) - 7pt);
    font-size: calc(var(--default-font-size) + 2pt);
    line-height: calc(var(--default-font-size) + 5pt);
    letter-spacing: 0px;
    font-weight: 500;
  }

  h5 {
    margin: calc(var(--paragraph-spacing) + 3pt) var(--text-margins) calc(var(--paragraph-spacing) - 6pt);
    font-size: calc(var(--default-font-size) + 2pt);
    line-height: calc(var(--default-font-size) + 5pt);
    letter-spacing: 0px;
    font-weight: 400;
  }

  h6 {
    margin: calc(var(--paragraph-spacing) + 2pt) var(--text-margins) calc(var(--paragraph-spacing) - 5pt);
    font-size: calc(var(--default-font-size) + 1.5pt);
    line-height: calc(var(--default-font-size) + 4.5pt);
    font-weight: 400;
  }


  /* Figures and images */

  figure {
    margin: 0;
  }

  figcaption, caption, figcaption p, caption p {
    margin: var(--text-margins);
    color: var(--text-light);
    font-size: var(--small-font-size);
    line-height: var(--small-line-height);
  }

  figcaption, caption {
    margin-bottom: 0;
  }

  figcaption:first-child, caption:first-child {
    margin-top: var(--paragraph-spacing);
  }

  figcaption:last-child, caption:last-child {
    margin-bottom: var(--paragraph-spacing);
  }

  figure p, figcaption p, caption p {
    margin-top: 0;
    margin-bottom: 0;
  }

  img {
    display: inline-block;
    vertical-align: middle;
  }

  /* Our Javascript adds a special class to paragraphs that have a single image
     so we can center them.
  */
  p.__CENTER_IMAGE, div.__CENTER_IMAGE {
      text-align: center;
  }


  /* Videos */

  iframe {
    max-width: 100%;
  }

  video {
    max-width: 100%;
  }

  /* Blockquote */

  blockquote {
    margin: 0 0 var(--paragraph-spacing) 2px;
    padding: var(--small-padding) 0 var(--small-padding) 10pt;
    border-left: 0.5px solid var(--text-light);
  }

  blockquote > p:last-child,
  blockquote > ul li:last-child,
  blockquote > ol li:last-child,
  blockquote > dl li:last-child {
    margin-bottom: 0;
  }


  /* Horizontal rule */

  hr {
    margin: 0 18% var(--paragraph-spacing);
    border-top: 0.5px solid var(--text-light);
  }


  /* Code and preformatted content */

  code, kbd, samp, tt {
    padding: var(--small-padding);
    padding-left: var(--text-margins);
    font-family: var(--monospace-font);
    background-color: var(--background-light);
    font-size: var(--monospace-font-size);
  }

  pre {
    padding: var(--small-padding);
    padding-left: var(--text-margins);
    background-color: var(--background-light);
    overflow-x: auto;
  }

  /* Tables */

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    text-align: left;
    padding: var(--small-padding);
  }

  tr {
    border-top: 0.5px solid var(--text-light);
  }

  tr:first-child {
    border-top: 2px solid var(--text-light);
  }

  tr:last-child {
    border-bottom: 2px solid var(--text-light);
  }


  /* Unsupported tags */

  svg {
    display: none;
  }


  /* Fixes for crappy HTML */

  :not(p) span + p {
    margin-top: var(--paragraph-spacing);
  }


  /* Our own highlighting */
  .__HIGHLIGHT {
    background-color: yellow;
  }

`
