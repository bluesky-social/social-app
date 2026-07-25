import {ComponentChildren, h} from 'preact'
import {useEffect, useRef} from 'preact/hooks'

import {Link} from './link'

export function Container({
  children,
  href,
}: {
  children: ComponentChildren
  href?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const prevHeight = useRef(0)

  useEffect(() => {
    if (ref.current) {
      const observer = new ResizeObserver(entries => {
        const entry = entries[0]
        if (!entry) return

        let {height} = entry.contentRect
        height += 4 // border-2 = 2px top + 2px bottom
        if (height !== prevHeight.current) {
          prevHeight.current = height
          window.parent.postMessage(
            {height, id: new URLSearchParams(window.location.search).get('id')},
            '*',
          )
        }
      })
      observer.observe(ref.current)
      return () => observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className="w-full border-2 border-brand text-black relative transition-colors max-w-[600px] min-w-[300px] flex items-center dark:text-slate-200 rounded-[32px] overflow-hidden cursor-pointer"
      onClick={() => {
        if (ref.current && href) {
          // forwardRef requires preact/compat - let's keep it simple
          // to keep the bundle size down
          const anchor = ref.current.querySelector('a')
          if (anchor) {
            anchor.click()
          }
        }
      }}>
      {href && <Link href={href} />}
      <div className="flex-1 max-w-full">{children}</div>
    </div>
  )
}
