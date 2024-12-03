// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  bluesky: {
    scan: (element?: Pick<Element, 'querySelectorAll'>) => void
  }
}

const EMBED_URL = 'https://embed.bsky.app'

window.bluesky = window.bluesky || {
  scan,
}

/**
 * Listen for messages from the Bluesky embed iframe and adjust the height of
 * the iframe accordingly.
 */
window.addEventListener('message', event => {
  if (event.origin !== EMBED_URL) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const id = (event.data as {id: string}).id
  if (!id) {
    return
  }

  const embed = document.querySelector<HTMLIFrameElement>(
    `[data-bluesky-id="${id}"]`,
  )

  if (!embed) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const height = (event.data as {height: number}).height
  if (height) {
    embed.style.height = `${height}px`
  }
})

/**
 * Scan the document for all elements with the data-bluesky-aturi attribute,
 * and initialize them as Bluesky embeds.
 *
 * @param element Only scan this specific element @default document @optional
 * @returns
 */
function scan(node = document) {
  const embeds = node.querySelectorAll<HTMLIFrameElement>('[data-bluesky-uri]')

  for (let i = 0; i < embeds.length; i++) {
    const id = String(Math.random()).slice(2)

    const embed = embeds[i]
    const aturi = embed.getAttribute('data-bluesky-uri')

    if (!aturi) {
      continue
    }

    const ref_url = location.origin + location.pathname

    const searchParams = new URLSearchParams()
    searchParams.set('id', id)
    if (ref_url.startsWith('http')) {
      searchParams.set('ref_url', encodeURIComponent(ref_url))
    }

    const iframe = document.createElement('iframe')
    iframe.setAttribute('data-bluesky-id', id)
    iframe.src = `${EMBED_URL}/embed/${aturi.slice(
      'at://'.length,
    )}?${searchParams.toString()}`
    iframe.width = '100%'
    iframe.style.border = 'none'
    iframe.style.display = 'block'
    iframe.style.flexGrow = '1'
    iframe.frameBorder = '0'
    iframe.scrolling = 'no'

    const container = document.createElement('div')
    container.style.maxWidth = '600px'
    container.style.width = '100%'
    container.style.marginTop = '10px'
    container.style.marginBottom = '10px'
    container.style.display = 'flex'
    container.className = 'bluesky-embed'

    container.appendChild(iframe)

    embed.replaceWith(container)
  }
}

if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
  scan()
} else {
  document.addEventListener('DOMContentLoaded', () => scan())
}
