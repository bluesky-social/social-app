import {createServer as createHTTPServer} from 'node:http'
import {parse} from 'node:url'
import {createServer, TestPDS} from '../jest/test-pds'

async function main() {
  let server: TestPDS
  createHTTPServer(async (req, res) => {
    const url = parse(req.url || '/', true)
    if (req.method !== 'POST') {
      return res.writeHead(200).end()
    }
    try {
      console.log('Closing old server')
      await server?.close()
      console.log('Starting new server')
      const inviteRequired = url?.query && 'invite' in url.query
      server = await createServer({inviteRequired})
      console.log('Listening at', server.pdsUrl)
      if (url?.query) {
        if ('users' in url.query) {
          console.log('Generating mock users')
          await server.mocker.createUser('alice')
          await server.mocker.createUser('bob')
          await server.mocker.createUser('carla')
          await server.mocker.users.alice.agent.upsertProfile(() => ({
            displayName: 'Alice',
            description: 'Test user 1',
          }))
          await server.mocker.users.bob.agent.upsertProfile(() => ({
            displayName: 'Bob',
            description: 'Test user 2',
          }))
          await server.mocker.users.carla.agent.upsertProfile(() => ({
            displayName: 'Carla',
            description: 'Test user 3',
          }))
        }
        if ('follows' in url.query) {
          console.log('Generating mock follows')
          await server.mocker.follow('alice', 'bob')
          await server.mocker.follow('alice', 'carla')
          await server.mocker.follow('bob', 'alice')
          await server.mocker.follow('bob', 'carla')
          await server.mocker.follow('carla', 'alice')
          await server.mocker.follow('carla', 'bob')
        }
        if ('posts' in url.query) {
          console.log('Generating mock posts')
          for (let user in server.mocker.users) {
            await server.mocker.users[user].agent.post({text: 'Post'})
          }
        }
        if ('thread' in url.query) {
          console.log('Generating mock posts')
          const res = await server.mocker.users.bob.agent.post({
            text: 'Thread root',
          })
          await server.mocker.users.carla.agent.post({
            text: 'Thread reply',
            reply: {
              parent: {cid: res.cid, uri: res.uri},
              root: {cid: res.cid, uri: res.uri},
            },
          })
        }
        if ('labels' in url.query) {
          console.log('Generating naughty users with labels')

          const anchorPost = await server.mocker.createPost(
            'alice',
            'Anchor post',
          )

          for (const user of [
            'csam-account',
            'csam-profile',
            'csam-posts',
            'porn-account',
            'porn-profile',
            'porn-posts',
            'nudity-account',
            'nudity-profile',
            'nudity-posts',
            'unknown-account',
            'unknown-profile',
            'unknown-posts',
            'muted-account',
          ]) {
            await server.mocker.createUser(user)
            await server.mocker.follow('alice', user)
            await server.mocker.follow(user, 'alice')
            await server.mocker.createPost(user, `Unlabeled post from ${user}`)
            await server.mocker.createReply(
              user,
              `Unlabeled reply from ${user}`,
              anchorPost,
            )
            await server.mocker.like(user, anchorPost)
          }

          await server.mocker.labelAccount('csam', 'csam-account')
          await server.mocker.labelProfile('csam', 'csam-profile')
          await server.mocker.labelPost(
            'csam',
            await server.mocker.createPost('csam-posts', 'csam post'),
          )
          await server.mocker.labelPost(
            'csam',
            await server.mocker.createQuotePost(
              'csam-posts',
              'csam quote post',
              anchorPost,
            ),
          )
          await server.mocker.labelPost(
            'csam',
            await server.mocker.createReply(
              'csam-posts',
              'csam reply',
              anchorPost,
            ),
          )

          await server.mocker.labelAccount('porn', 'porn-account')
          await server.mocker.labelProfile('porn', 'porn-profile')
          await server.mocker.labelPost(
            'porn',
            await server.mocker.createPost('porn-posts', 'porn post'),
          )
          await server.mocker.labelPost(
            'porn',
            await server.mocker.createQuotePost(
              'porn-posts',
              'porn quote post',
              anchorPost,
            ),
          )
          await server.mocker.labelPost(
            'porn',
            await server.mocker.createReply(
              'porn-posts',
              'porn reply',
              anchorPost,
            ),
          )

          await server.mocker.labelAccount('nudity', 'nudity-account')
          await server.mocker.labelProfile('nudity', 'nudity-profile')
          await server.mocker.labelPost(
            'nudity',
            await server.mocker.createPost('nudity-posts', 'nudity post'),
          )
          await server.mocker.labelPost(
            'nudity',
            await server.mocker.createQuotePost(
              'nudity-posts',
              'nudity quote post',
              anchorPost,
            ),
          )
          await server.mocker.labelPost(
            'nudity',
            await server.mocker.createReply(
              'nudity-posts',
              'nudity reply',
              anchorPost,
            ),
          )

          await server.mocker.labelAccount(
            'not-a-real-label',
            'unknown-account',
          )
          await server.mocker.labelProfile(
            'not-a-real-label',
            'unknown-profile',
          )
          await server.mocker.labelPost(
            'not-a-real-label',
            await server.mocker.createPost('unknown-posts', 'unknown post'),
          )
          await server.mocker.labelPost(
            'not-a-real-label',
            await server.mocker.createQuotePost(
              'unknown-posts',
              'unknown quote post',
              anchorPost,
            ),
          )
          await server.mocker.labelPost(
            'not-a-real-label',
            await server.mocker.createReply(
              'unknown-posts',
              'unknown reply',
              anchorPost,
            ),
          )

          await server.mocker.users.alice.agent.mute('muted-account.test')
          await server.mocker.createPost('muted-account', 'muted post')
          await server.mocker.createQuotePost(
            'muted-account',
            'account quote post',
            anchorPost,
          )
          await server.mocker.createReply(
            'muted-account',
            'account reply',
            anchorPost,
          )
        }
      }
      console.log('Ready')
      return res.writeHead(200).end(server.pdsUrl)
    } catch (e) {
      console.error('Error!', e)
      return res.writeHead(500).end()
    }
  }).listen(1986)
  console.log('Mock server manager listening on 1986')
}
main()
