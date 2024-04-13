import {h} from 'preact'

export function Link({
  href,
  className,
  ...props
}: {
  href: string
  className?: string
} & h.JSX.HTMLAttributes<HTMLAnchorElement>) {
  const newSearchParam = new URLSearchParams()
  newSearchParam.set('ref_src', 'embed')

  return (
    <a
      href={`${
        href.startsWith('http') ? href : `https://bsky.app${href}`
      }?${newSearchParam.toString()}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={evt => evt.stopPropagation()}
      className={`cursor-pointer ${className || ''}`}
      {...props}
    />
  )
}
