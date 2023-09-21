import {useEffect} from 'react'

// This is the handler for the middle mouse button click on the feed.
// Normally, we would do this via `onAuxClick` handler on each link element
// However, that handler is not supported on react-native-web and there are some
// discrepancies between various browsers (i.e: safari doesn't trigger it and routes through click event)
// So, this temporary alternative is meant to bridge the gap in an efficient way until the support improves.
export const useAuxClick = () => {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  useEffect(() => {
    // On the web, it should always be there but in case it gets accidentally included in native builds
    const wrapperEl = document?.body

    // Safari already handles auxclick event as click+metaKey so we need to avoid doing this there in case it becomes recursive
    if (wrapperEl && !isSafari) {
      const handleAuxClick = (e: MouseEvent & {target: HTMLElement}) => {
        // Only handle the middle mouse button click
        // Only handle if the clicked element itself or one of its ancestors is a link
        if (
          e.button !== 1 ||
          e.target.closest('a') ||
          e.target.tagName === 'A'
        ) {
          return
        }

        // On the original element, trigger a click event with metaKey set to true so that it triggers
        // the browser's default behavior of opening the link in a new tab
        e.target.dispatchEvent(
          new MouseEvent('click', {metaKey: true, bubbles: true}),
        )
      }

      // @ts-ignore For web only
      wrapperEl.addEventListener('auxclick', handleAuxClick)

      return () => {
        // @ts-ignore For web only
        wrapperEl?.removeEventListener('auxclick', handleAuxClick)
      }
    }
  }, [isSafari])
}
