import {library} from '@fortawesome/fontawesome-svg-core'

import {faAngleLeft} from '@fortawesome/free-solid-svg-icons/faAngleLeft'
import {faAngleRight} from '@fortawesome/free-solid-svg-icons/faAngleRight'
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars'
import {faBell} from '@fortawesome/free-solid-svg-icons/faBell'
import {faBell as farBell} from '@fortawesome/free-regular-svg-icons/faBell'
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck'
import {faClone} from '@fortawesome/free-regular-svg-icons/faClone'
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
    faAngleLeft,
    faAngleRight,
    faArrowLeft,
    faBars,
    faBell,
    farBell,
    faCheck,
    faClone,
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
