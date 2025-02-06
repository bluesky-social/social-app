import '../index.css'

import {AppBskyFeedDefs, AtpAgent} from '@atproto/api'
import {t} from '@lingui/core/macro'
import {h, render} from 'preact'

import logo from '../../assets/logo.svg'
import {initColorMode} from '../color-mode'
import {Container} from '../components/container'
import {Link} from '../components/link'
import {Post} from '../components/post'
import I18nProvider from '../locale/i18nProvider'
import {getRkey} from '../utils'

const root = document.getElementById('app')
if (!root) throw new Error('No root element')

const agent = new AtpAgent({
  service: 'https://public.api.bsky.app',
})

const uri = `at://${window.location.pathname.slice('/embed/'.length)}`
if (!uri) {
  throw new Error('No uri in path')
}

initColorMode()

agent
  .getPostThread({
    uri,
    depth: 0,
    parentHeight: 0,
  })
  .then(({data}) => {
    if (!AppBskyFeedDefs.isThreadViewPost(data.thread)) {
      throw new Error('Expected a ThreadViewPost')
    }
    const pwiOptOut = !!data.thread.post.author.labels?.find(
      label => label.val === '!no-unauthenticated',
    )
    if (pwiOptOut) {
      render(
        <I18nProvider>
          <PwiOptOut thread={data.thread} />
        </I18nProvider>,
        root,
      )
    } else {
      render(
        <I18nProvider>
          <Post thread={data.thread} />
        </I18nProvider>,
        root,
      )
    }
  })
  .catch(err => {
    console.error(err)
    render(<ErrorMessage />, root)
  })

function PwiOptOut({thread}: {thread: AppBskyFeedDefs.ThreadViewPost}) {
  const href = `/profile/${thread.post.author.did}/post/${getRkey(thread.post)}`
  return (
    <Container href={href}>
      <Link
        href={href}
        className="transition-transform hover:scale-110 absolute top-4 right-4">
        <img src={logo} className="h-6" />
      </Link>
      <div className="w-full py-12 gap-4 flex flex-col items-center">
        <p className="max-w-80 text-center w-full text-textLight dark:text-textDimmed">
          {t`The author of this post has requested their posts not be displayed on external sites.`}
        </p>
        <Link
          href={href}
          className="max-w-80 rounded-lg bg-brand text-white text-center py-1 px-4 w-full mx-auto">
          {t`View on Bluesky`}
        </Link>
      </div>
    </Container>
  )
}

function ErrorMessage() {
  return (
    <Container href="https://bsky.app/">
      <Link
        href="https://bsky.app/"
        className="transition-transform hover:scale-110 absolute top-4 right-4">
        <img src={logo} className="h-6" />
      </Link>
      <p className="my-16 text-center w-full text-textLight dark:text-textDimmed">
        {t`Post not found, it may have been deleted.`}
      </p>
    </Container>
  )
}
