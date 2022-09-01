import {library} from '@fortawesome/fontawesome-svg-core'

import {faAngleLeft} from '@fortawesome/free-solid-svg-icons/faAngleLeft'
import {faAngleRight} from '@fortawesome/free-solid-svg-icons/faAngleRight'
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import {faBars} from '@fortawesome/free-solid-svg-icons/faBars'
import {faBell} from '@fortawesome/free-solid-svg-icons/faBell'
import {faBell as farBell} from '@fortawesome/free-regular-svg-icons/faBell'
import {faBookmark} from '@fortawesome/free-solid-svg-icons/faBookmark'
import {faBookmark as farBookmark} from '@fortawesome/free-regular-svg-icons/faBookmark'
import {faCheck} from '@fortawesome/free-solid-svg-icons/faCheck'
import {faClone} from '@fortawesome/free-regular-svg-icons/faClone'
import {faComment} from '@fortawesome/free-regular-svg-icons/faComment'
import {faEllipsis} from '@fortawesome/free-solid-svg-icons/faEllipsis'
import {faGear} from '@fortawesome/free-solid-svg-icons/faGear'
import {faHeart} from '@fortawesome/free-regular-svg-icons/faHeart'
import {faHeart as fasHeart} from '@fortawesome/free-solid-svg-icons/faHeart'
import {faHouse} from '@fortawesome/free-solid-svg-icons/faHouse'
import {faMagnifyingGlass} from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass'
import {faMessage} from '@fortawesome/free-regular-svg-icons/faMessage'
import {faPenNib} from '@fortawesome/free-solid-svg-icons/faPenNib'
import {faPlus} from '@fortawesome/free-solid-svg-icons/faPlus'
import {faShareFromSquare} from '@fortawesome/free-solid-svg-icons/faShareFromSquare'
import {faRetweet} from '@fortawesome/free-solid-svg-icons/faRetweet'
import {faUser} from '@fortawesome/free-regular-svg-icons/faUser'
import {faUsers} from '@fortawesome/free-solid-svg-icons/faUsers'
import {faX} from '@fortawesome/free-solid-svg-icons/faX'

export function setup() {
  library.add(
    faAngleLeft,
    faAngleRight,
    faArrowLeft,
    faBars,
    faBell,
    farBell,
    faBookmark,
    farBookmark,
    faCheck,
    faClone,
    faComment,
    faEllipsis,
    faGear,
    faHeart,
    fasHeart,
    faHouse,
    faMagnifyingGlass,
    faMessage,
    faPenNib,
    faPlus,
    faRetweet,
    faShareFromSquare,
    faUser,
    faUsers,
    faX,
  )
}
