/**
 * Will get the current time on the server
 * because the client time is not accurate
 * and can make user manipulate the time of the post
 */
export const getServerDate = async () => {
  const createdAt = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
  const response = await createdAt.json()
  const date = new Date(response.datetime)

  return date.toISOString()
}
