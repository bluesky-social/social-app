export async function getUriSize(uri: string): Promise<number> {
  const response = await fetch(uri)
  const blob = await response.blob()
  return blob.size
}
