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
      className="w-full bg-brand text-black dark:bg-brand relative transition-colors max-w-[600px] min-w-[300px] flex items-center  dark:text-slate-200 rounded-[20px] cursor-pointer hover:bg-opacity-90"
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
      <div className="flex-1 px-[6px] pt-[6px] pb-2.5 max-w-full">
        {children}
      </div>
    </div>
  )
}
