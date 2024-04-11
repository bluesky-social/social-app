// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Window {
  bluesky: {
    /**
     * Scan the document for all elements with the data-bluesky-aturi attribute,
     * and initialize them as Bluesky embeds.
     *
     * @param element Only scan this specific element @default document @optional
     * @returns
     */
    scan: (element?: Pick<Element, 'querySelectorAll'>) => void
    /**
     * List of embeds that have been initialized.
     */
    embeds: HTMLDivElement[]
  }
}

window.bluesky = window.bluesky || {
  scan,
  embeds: [],
}

function scan(node = document) {
  const embeds = node.querySelectorAll('[data-bluesky-uri]')

  for (let i = 0; i < embeds.length; i++) {
    const embed = embeds[i]
    const aturi = embed.getAttribute('data-bluesky-uri')

    if (!aturi) {
      continue
    }

    const type = aturi.split('/').at(3)

    if (type !== 'app.bsky.feed.post') {
      if (!type) {
        console.warn('Invalid Bluesky embed URI')
      } else {
        console.warn(`Unsupported Bluesky embed type: ${type}`)
      }
      continue
    }

    const iframe = document.createElement('iframe')
    iframe.src = `https://embed.bsky.app/embed/post.html?uri=${aturi}`
    iframe.width = '100%'
    iframe.style.border = 'none'
    iframe.style.display = 'block'
    iframe.style.flexGrow = '1'
    iframe.frameBorder = '0'
    iframe.scrolling = 'no'

    const container = document.createElement('div')
    container.style.maxWidth = '600px'
    container.style.width = '100%'
    container.style.marginLeft = 'auto'
    container.style.marginRight = 'auto'
    container.style.marginTop = '10px'
    container.style.marginBottom = '10px'
    container.style.display = 'flex'

    container.appendChild(iframe)

    embed.replaceWith(container)

    window.bluesky.embeds.push(container)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => scan())
} else {
  scan()
}
