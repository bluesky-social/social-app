import '../index.css'

import {Client, isAtUriString} from '@atproto/lex'
import {h, render} from 'preact'

import logo from '../../assets/logo.svg'
import {applyTheme, initSystemColorMode} from '../color-mode'
import {Container} from '../components/container'
import {Link} from '../components/link'
import {Post} from '../components/post'
import * as app from '../lexicons/app'
import {getRkey} from '../util/rkey'

const root = document.getElementById('app')
if (!root) throw new Error('No root element')

const client = new Client('https://public.api.bsky.app')

const uri = `at://${window.location.pathname.slice('/embed/'.length)}`
if (!isAtUriString(uri)) {
  throw new Error('No uri in path')
}

const query = new URLSearchParams(window.location.search)

// theme - default to light mode
const colorMode = query.get('colorMode')

switch (colorMode) {
  case 'dark':
    applyTheme('dark')
    break
  case 'system':
    initSystemColorMode()
    break
  case 'light':
  default:
    applyTheme('light')
    break
}

client
  .call(app.bsky.feed.getPosts, {
    uris: [uri],
  })
  .then(({posts}) => {
    const post = posts[0]

    if (!post) {
      throw new Error('Post not found')
    }

    const pwiOptOut = !!post.author.labels?.find(
      label => label.val === '!no-unauthenticated',
    )

    if (pwiOptOut) {
      render(<PwiOptOut post={post} />, root)
    } else {
      render(<Post post={post} />, root)
    }
  })
  .catch(err => {
    console.error(err)
    render(<ErrorMessage />, root)
  })

function PwiOptOut({post}: {post: app.bsky.feed.defs.PostView}) {
  const href = `/profile/${post.author.did}/post/${getRkey({uri: post.uri})}`
  return (
    <Container href={href}>
      <Link
        href={href}
        className="transition-transform hover:scale-110 absolute top-4 right-4">
        <img src={logo} className="h-6" />
      </Link>
      <div className="w-full py-12 gap-4 flex flex-col items-center">
        <p className="max-w-80 text-center w-full text-textLight dark:text-textDimmed">
          The author of this post has requested their posts not be displayed on
          external sites.
        </p>
        <Link
          href={href}
          className="max-w-80 rounded-lg bg-brand text-white text-center py-1 px-4 w-full mx-auto">
          View on Bluesky
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
        Post not found, it may have been deleted.
      </p>
    </Container>
  )
}
