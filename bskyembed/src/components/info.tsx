import {ComponentChildren, h} from 'preact'

import infoIcon from '../../assets/circleInfo_stroke2_corner0_rounded.svg'

export function Info({children}: {children: ComponentChildren}) {
  return (
    <div className="w-full rounded-lg border py-2 px-2.5 flex-row flex gap-2 bg-neutral-50">
      <img src={infoIcon} className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="text-sm text-textLight">{children}</p>
    </div>
  )
}
