import {Asset} from 'expo-asset'

/*
 * On web, nano-icons reads the font family straight off CSS and never loads
 * the font itself, so register it here. A `url()` in a stylesheet does not
 * work: Metro injects CSS without rewriting relative URLs, so the font 404s
 * and every icon renders as tofu. Resolving through expo-asset gives the
 * served URL in both dev and production builds.
 */
const uri = Asset.fromModule(
  require('../../../assets/nano-icons/nanoicons/app-icons.woff2'),
).uri

const style = document.createElement('style')
style.textContent = `@font-face {
  font-family: 'app-icons';
  src: url('${uri}') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}`
document.head.appendChild(style)

export {}
