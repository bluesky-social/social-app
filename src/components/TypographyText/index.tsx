import {createTextRenderer} from '@bsky.app/react-native-fast-text'
import {UITextView} from '@bsky.app/react-native-uitextview'

/** Shared ancestry keeps nested selectable UIKit text on its original renderer. */
export const useTypographyText = createTextRenderer<
  React.ComponentProps<typeof UITextView> & {
    dataSet?: Record<string, string | number | undefined>
  }
>(UITextView, {
  ignoredProps: ['uiTextView', 'dataSet'],
  /* Non-selectable UITextView delegates to RN Text, which guards itself. */
  needsAncestorGuard: props => Boolean(props.selectable && props.uiTextView),
})
