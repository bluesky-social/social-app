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
        height += 2 // border top and bottom
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
      className="w-full bg-white text-black hover:bg-neutral-50 dark:bg-dimmedBg dark:hover:bg-dimmedBgLighten relative transition-colors max-w-[600px] min-w-[300px] flex border dark:border-slate-600 dark:text-slate-200 rounded-xl"
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
      <div className="flex-1 px-4 pt-3 pb-2.5">{children}</div>
    </div>
  )
}
