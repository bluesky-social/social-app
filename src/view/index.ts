import moment from 'moment'
import {library} from '@fortawesome/fontawesome-svg-core'

import {faComment} from '@fortawesome/free-regular-svg-icons/faComment'
import {faHeart} from '@fortawesome/free-regular-svg-icons/faHeart'
import {faShareFromSquare} from '@fortawesome/free-solid-svg-icons/faShareFromSquare'
import {faRetweet} from '@fortawesome/free-solid-svg-icons/faRetweet'

export function setup() {
  moment.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'a few seconds',
      ss: '%ds',
      m: 'a minute',
      mm: '%dm',
      h: 'an hour',
      hh: '%dh',
      d: 'a day',
      dd: '%dd',
      w: 'a week',
      ww: '%dw',
      M: 'a month',
      MM: '%dmo',
      y: 'a year',
      yy: '%dy',
    },
  })
  library.add(faComment, faHeart, faRetweet, faShareFromSquare)
}
