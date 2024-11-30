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

  let backgroundColorClass = 'bg-white hover:bg-neutral-50'
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    backgroundColorClass =
      'bg-[#161e27] hover:bg-[#202831] text-[#f1f3f5] border-[#2e4052]'
  }
  const className = `w-full ${backgroundColorClass} relative transition-colors max-w-[600px] min-w-[300px] flex border rounded-xl`

  return (
    <div
      ref={ref}
      className={className}
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
