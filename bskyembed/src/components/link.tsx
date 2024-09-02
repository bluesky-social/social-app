import {h} from 'preact'

export function Link({
  href,
  className,
  disableTracking,
  ...props
}: {
  href: string
  className?: string
  disableTracking?: boolean
} & h.JSX.HTMLAttributes<HTMLAnchorElement>) {
  const searchParam = new URLSearchParams(window.location.search)
  const ref_url = searchParam.get('ref_url')

  const newSearchParam = new URLSearchParams()
  newSearchParam.set('ref_src', 'embed')
  if (ref_url) {
    newSearchParam.set('ref_url', ref_url)
  }

  return (
    <a
      href={`${href.startsWith('http') ? href : `https://bsky.app${href}`}${
        disableTracking ? '' : `?${newSearchParam.toString()}`
      }`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={evt => evt.stopPropagation()}
      className={`cursor-pointer ${className || ''}`}
      {...props}
    />
  )
}
