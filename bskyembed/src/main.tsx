import './index.css'

import {AppBskyFeedDefs, BskyAgent} from '@atproto/api'
import {h, render} from 'preact'

import logo from '../assets/logo.svg'
import {Container} from './container'
import {Link} from './link'
import {Post} from './post'

const root = document.getElementById('app')
if (!root) throw new Error('No root element')

const searchParams = new URLSearchParams(window.location.search)

const agent = new BskyAgent({
  service: searchParams.get('service') || 'https://public.api.bsky.app',
})

const uri = searchParams.get('uri')

if (!uri) {
  throw new Error('No uri in query string')
}

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
    console.log(data.thread)
    render(<Post thread={data.thread} />, root)
  })
  .catch(err => {
    console.error(err)
    render(
      <Container href="https://bsky.social/about">
        <Link
          href="https://bsky.social/about"
          className="transition-transform hover:scale-110 absolute top-4 right-4">
          <img src={logo as string} className="h-6" />
        </Link>
        <p className="my-16 text-center w-full text-textLight">
          Post not found, it may have been deleted
        </p>
      </Container>,
      root,
    )
  })
