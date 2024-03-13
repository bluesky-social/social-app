import 'react'
import {withBreakpoints} from 'view/com/util/layouts/withBreakpoints'
import {WelcomeDesktop} from './WelcomeDesktop'
import {WelcomeMobile} from './WelcomeMobile'

export const Welcome = withBreakpoints(
  WelcomeMobile,
  WelcomeDesktop,
  WelcomeDesktop,
)
