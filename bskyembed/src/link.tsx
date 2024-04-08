import {h} from 'preact'

export function Link({
  href,
  ...props
}: {href: string} & h.JSX.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={`https://bsky.app${href}`}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={evt => evt.stopPropagation()}
      {...props}
    />
  )
}
