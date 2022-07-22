import moment from 'moment'
import {library} from '@fortawesome/fontawesome-svg-core'

import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars'
import {faBell} from '@fortawesome/free-solid-svg-icons/faBell'
import {faComment} from '@fortawesome/free-regular-svg-icons/faComment'
import {faHeart} from '@fortawesome/free-regular-svg-icons/faHeart'
import {faHeart as fasHeart} from '@fortawesome/free-solid-svg-icons/faHeart'
import {faHouse} from '@fortawesome/free-solid-svg-icons/faHouse'
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass'
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus'
import {faShareFromSquare} from '@fortawesome/free-solid-svg-icons/faShareFromSquare'
import {faRetweet} from '@fortawesome/free-solid-svg-icons/faRetweet'
import {faX} from '@fortawesome/free-solid-svg-icons/faX'

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
  library.add(
    faArrowLeft,
    faBars,
    faBell,
    faComment,
    faHeart,
    fasHeart,
    faHouse,
    faPlus,
    faMagnifyingGlass,
    faRetweet,
    faShareFromSquare,
    faX,
  )
}
