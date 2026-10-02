import {Asset} from 'expo-asset'

/*
 * On web, nano-icons reads the font family straight off CSS and never loads
 * the font itself, so register it here. A `url()` in a stylesheet does not
 * work: Metro injects CSS without rewriting relative URLs, so the font 404s
 * and every icon renders as tofu. Resolving through expo-asset gives the
 * served URL in both dev and production builds.
 */
const fonts = {
  'icons-ui': require('../../../assets/nano-icons/nanoicons/icons-ui.woff2'),
  'icons-brands': require('../../../assets/nano-icons/nanoicons/icons-brands.woff2'),
  'icons-community': require('../../../assets/nano-icons/nanoicons/icons-community.woff2'),
}

const style = document.createElement('style')
style.textContent = Object.entries(fonts)
  .map(
    ([family, module]) => `@font-face {
  font-family: '${family}';
  src: url('${Asset.fromModule(module).uri}') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}`,
  )
  .join('\n')
document.head.appendChild(style)

export {}
