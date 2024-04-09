import {ComponentChildren, h} from 'preact'
import {useRef} from 'preact/hooks'

import {Link} from './link'

export function Container({
  children,
  href,
}: {
  children: ComponentChildren
  href: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div
      ref={ref}
      className="w-full bg-white hover:bg-neutral-50 relative transition-colors max-w-[550px] min-w-[300px] flex border rounded-xl px-4 pt-3 pb-2.5"
      onClick={() => {
        if (ref.current) {
          // forwardRef requires preact/compat - let's keep it simple
          // to keep the bundle size down
          const anchor = ref.current.querySelector('a')
          if (anchor) {
            anchor.click()
          }
        }
      }}>
      <Link href={href} />
      {children}
    </div>
  )
}
