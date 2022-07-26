import {library} from '@fortawesome/fontawesome-svg-core'

import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars'
import {faBell} from '@fortawesome/free-solid-svg-icons/faBell'
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck'
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
  library.add(
    faArrowLeft,
    faBars,
    faBell,
    faCheck,
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
