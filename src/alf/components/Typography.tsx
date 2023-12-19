import {Text as RNText} from 'react-native'
import {styled} from '#/alf/system'
import {web} from '#/alf/util/platform'

export const Text = styled(RNText, {
  color: 'l7',
  fontSize: 's',
})

/**
 * @see https://necolas.github.io/react-native-web/docs/accessibility/#semantic-html
 * @see https://docs.expo.dev/develop/user-interface/fonts/
 */
export const H1 = styled(RNText, {
  color: 'l7',
  fontSize: 'l',
  gtMobile: {
    fontSize: 'xl',
  },
  ...web({
    role: 'heading',
    'aria-level': 1,
  }),
})
export const H2 = styled(RNText, {
  color: 'l7',
  fontSize: 'm',
  gtMobile: {
    fontSize: 'l',
  },
  ...web({
    role: 'heading',
    'aria-level': 2,
  }),
})
export const H3 = styled(RNText, {
  color: 'l7',
  fontSize: 'm',
  ...web({
    role: 'heading',
    'aria-level': 3,
  }),
})
export const H4 = styled(RNText, {
  color: 'l7',
  fontSize: 's',
  ...web({
    role: 'heading',
    'aria-level': 4,
  }),
})
export const H5 = styled(RNText, {
  color: 'l7',
  fontSize: 'xs',
  ...web({
    role: 'heading',
    'aria-level': 5,
  }),
})
export const H6 = styled(RNText, {
  color: 'l7',
  fontSize: 'xxs',
  ...web({
    role: 'heading',
    'aria-level': 6,
  }),
})
export const P = styled(RNText, {
  color: 'l7',
  fontSize: 's',
  ...web({
    role: 'paragraph',
  }),
})
