import {TextInputProps} from 'react-native'

import {BaseProps} from '#/components/forms/types'

export type InputDateProps = BaseProps & {
  /**
   * **NOTE:** Available only on web
   */
  autoFocus?: TextInputProps['autoFocus']
}
