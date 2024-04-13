import {h} from 'preact'

export function Link({
  href,
  className,
  ...props
}: {
  href: string
  className?: string
} & h.JSX.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href.startsWith('http') ? href : `https://bsky.app${href}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={evt => evt.stopPropagation()}
      className={`cursor-pointer ${className || ''}`}
      {...props}
    />
  )
}
