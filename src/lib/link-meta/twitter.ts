export const extractTwitterMeta = ({
  pathname,
}: {
  pathname: string
}): Record<string, string> => {
  const res = {title: 'Twitter'}
  const parsedPathname = pathname.split('/')
  if (parsedPathname.length <= 1 || parsedPathname[1].length <= 1) {
    // Excluding one letter usernames as they're reserved by twitter for things like cases like twitter.com/i/articles/follows/-1675653703
    return res
  }
  const username = parsedPathname?.[1]
  const isUserProfile = parsedPathname?.length === 2

  res.title = isUserProfile
    ? `@${username} on Twitter`
    : `Tweet by @${username}`

  return res
}
