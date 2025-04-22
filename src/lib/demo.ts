import {type AppBskyFeedGetFeed} from '@atproto/api'

export const DEMO_FEED = {
  feed: [
    {
      post: {
        uri: 'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.feed.post/3lng6kvb6uc2a',
        cid: 'bafyreifqyej7jivzucaagu22f7jj7rvjcpbzv2kxo27wt47ktduwwdpdae',
        author: {
          did: 'did:plc:vwzwgnygau7ed7b7wt5ux7y2',
          handle: 'someoneelse.bsky.social',
          displayName: 'Not David',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:vwzwgnygau7ed7b7wt5ux7y2/bafkreifrtz3ngpzz5qmhjliv5toj4nvyjovijxs5e2la67wddhmdhro5he@jpeg',
          associated: {
            chat: {
              allowIncoming: 'following',
            },
          },
          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3kcvvfzq6o32a',
            followedBy:
              'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.graph.follow/3jwawchotz22h',
          },
          labels: [],
          createdAt: '2023-04-27T09:23:54.423Z',
          verification: {
            verifications: [
              {
                issuer: 'did:plc:z72i7hdynmk6r22z27h6tvur',
                uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.graph.verification/3lndpxt7ur22f',
                isValid: true,
                createdAt: '2025-04-21T10:48:58.775Z',
              },
            ],
            verifiedStatus: 'valid',
            trustedVerifierStatus: 'none',
          },
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T17:15:30.525Z',
          langs: ['en'],
          reply: {
            parent: {
              cid: 'bafyreic7wmhywvu5fi4lupswxpmyydqn2gl5kwnt4n4jxvb3lpej2l72ku',
              uri: 'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.feed.post/3lng66dkzu222',
            },
            root: {
              cid: 'bafyreic7wmhywvu5fi4lupswxpmyydqn2gl5kwnt4n4jxvb3lpej2l72ku',
              uri: 'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.feed.post/3lng66dkzu222',
            },
          },
          text: 'sometimes I go to the apple store just to look at them',
        },
        replyCount: 0,
        repostCount: 0,
        likeCount: 6,
        quoteCount: 0,
        indexedAt: '2025-04-22T17:15:31.251Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
      reply: {
        root: {
          uri: 'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.feed.post/3lng66dkzu222',
          cid: 'bafyreic7wmhywvu5fi4lupswxpmyydqn2gl5kwnt4n4jxvb3lpej2l72ku',
          author: {
            did: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
            handle: 'jasalterego.bsky.social',
            displayName: 'Jerry Appleseed',
            avatar:
              'https://cdn.bsky.app/img/avatar/plain/did:plc:vc7f4oafdgxsihk4cry2xpze/bafkreicwxwecqiko2rwwln5y3fqqb2zx6wfg5rxf5r7lukakkq2slqy5hy@jpeg',
            associated: {
              chat: {
                allowIncoming: 'following',
              },
            },
            viewer: {
              muted: false,
              blockedBy: false,
              following:
                'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3jx4rnvlnhl25',
              followedBy:
                'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.graph.follow/3jx4siiniuc2e',
            },
            labels: [
              {
                cts: '2024-05-17T21:53:59.049Z',
                src: 'did:plc:skibpmllbhxvbvwgtjxl3uao',
                uri: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
                val: 'cringe',
                ver: 1,
              },
              {
                cts: '2024-05-17T21:53:59.049Z',
                src: 'did:plc:skibpmllbhxvbvwgtjxl3uao',
                uri: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
                val: 'elder-watch',
                ver: 1,
              },
              {
                src: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
                uri: 'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.actor.profile/self',
                cid: 'bafyreidfiuv3c22vliyu2onazf23zrp35rr7i3upsqa2dsn5cqimmlgugm',
                val: '!no-unauthenticated',
                cts: '1970-01-01T00:00:00.000Z',
              },
            ],
            createdAt: '2023-04-23T20:11:04.375Z',
          },
          record: {
            $type: 'app.bsky.feed.post',
            createdAt: '2025-04-22T17:08:29.321Z',
            langs: ['en'],
            text: "(studying the blade) ow that's the sharp side",
          },
          replyCount: 8,
          repostCount: 37,
          likeCount: 252,
          quoteCount: 1,
          indexedAt: '2025-04-22T17:08:29.458Z',
          viewer: {
            threadMuted: false,
            embeddingDisabled: false,
          },
          labels: [],
          $type: 'app.bsky.feed.defs#postView',
        },
        parent: {
          uri: 'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.feed.post/3lng66dkzu222',
          cid: 'bafyreic7wmhywvu5fi4lupswxpmyydqn2gl5kwnt4n4jxvb3lpej2l72ku',
          author: {
            did: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
            handle: 'jasalterego.bsky.social',
            displayName: 'Jerry Appleseed',
            avatar:
              'https://cdn.bsky.app/img/avatar/plain/did:plc:vc7f4oafdgxsihk4cry2xpze/bafkreicwxwecqiko2rwwln5y3fqqb2zx6wfg5rxf5r7lukakkq2slqy5hy@jpeg',
            associated: {
              chat: {
                allowIncoming: 'following',
              },
            },
            viewer: {
              muted: false,
              blockedBy: false,
              following:
                'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3jx4rnvlnhl25',
              followedBy:
                'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.graph.follow/3jx4siiniuc2e',
            },
            labels: [
              {
                cts: '2024-05-17T21:53:59.049Z',
                src: 'did:plc:skibpmllbhxvbvwgtjxl3uao',
                uri: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
                val: 'cringe',
                ver: 1,
              },
              {
                cts: '2024-05-17T21:53:59.049Z',
                src: 'did:plc:skibpmllbhxvbvwgtjxl3uao',
                uri: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
                val: 'elder-watch',
                ver: 1,
              },
              {
                src: 'did:plc:vc7f4oafdgxsihk4cry2xpze',
                uri: 'at://did:plc:vc7f4oafdgxsihk4cry2xpze/app.bsky.actor.profile/self',
                cid: 'bafyreidfiuv3c22vliyu2onazf23zrp35rr7i3upsqa2dsn5cqimmlgugm',
                val: '!no-unauthenticated',
                cts: '1970-01-01T00:00:00.000Z',
              },
            ],
            createdAt: '2023-04-23T20:11:04.375Z',
          },
          record: {
            $type: 'app.bsky.feed.post',
            createdAt: '2025-04-22T17:08:29.321Z',
            langs: ['en'],
            text: '*sees the studio display* i think i hauve covid',
          },
          replyCount: 8,
          repostCount: 37,
          likeCount: 252,
          quoteCount: 1,
          indexedAt: '2025-04-22T17:08:29.458Z',
          viewer: {
            threadMuted: false,
            embeddingDisabled: false,
          },
          labels: [],
          $type: 'app.bsky.feed.defs#postView',
        },
      },
    },
    {
      post: {
        uri: 'at://did:plc:qvzn322kmcvd7xtnips5xaun/app.bsky.feed.post/3lnehbwkvzk2z',
        cid: 'bafyreidshyla4xoolb7fexhtlqcjjbn6ts7z4xja7gnlinroms5cuqg3fq',
        author: {
          did: 'did:plc:qvzn322kmcvd7xtnips5xaun',
          handle: 'scalzi.com',
          displayName: 'John Scalzi',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:qvzn322kmcvd7xtnips5xaun/bafkreih4dn5gllculyzb6wlqcqparkax35zloe3bzn2nufeqeilz4sutsu@jpeg',
          associated: {
            chat: {
              allowIncoming: 'following',
            },
          },

          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3kcvvfzq6o32a',
            followedBy:
              'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.graph.follow/3jwawchotz22h',
          },
          labels: [],
          createdAt: '2023-04-27T16:05:17.859Z',
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T00:46:14.095Z',
          embed: {
            $type: 'app.bsky.embed.images',
            images: [
              {
                alt: 'Smudge napping on the Eames chair, which is covered in a blanket to avoid getting cat hair on it. ',
                aspectRatio: {
                  height: 2000,
                  width: 1505,
                },
                image: {
                  $type: 'blob',
                  ref: {
                    $link:
                      'bafkreigkfbcmttc4r4avknp4y2mlcjlws3sdcat6jcyd2mjr7yvz6sje4q',
                  },
                  mimeType: 'image/jpeg',
                  size: 833834,
                },
              },
            ],
          },
          langs: ['en'],
          text: 'Smudge found the Eames chair',
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb:
                'https://cdn.bsky.app/img/feed_thumbnail/plain/did:plc:qvzn322kmcvd7xtnips5xaun/bafkreigkfbcmttc4r4avknp4y2mlcjlws3sdcat6jcyd2mjr7yvz6sje4q@jpeg',
              fullsize:
                'https://cdn.bsky.app/img/feed_fullsize/plain/did:plc:qvzn322kmcvd7xtnips5xaun/bafkreigkfbcmttc4r4avknp4y2mlcjlws3sdcat6jcyd2mjr7yvz6sje4q@jpeg',
              alt: 'Smudge napping on the Eames chair, which is covered in a blanket to avoid getting cat hair on it. ',
              aspectRatio: {
                height: 2000,
                width: 1505,
              },
            },
          ],
        },
        replyCount: 47,
        repostCount: 31,
        likeCount: 1543,
        quoteCount: 0,
        indexedAt: '2025-04-22T00:46:17.457Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: 'at://did:plc:jb2q4yqmgpmefxd4xx66gepm/app.bsky.feed.post/3lng4m2memc2k',
        cid: 'bafyreicvgwkd5xkbtu3eh756yodnynqbxoegzzqhhees5ou45t3gq3j6um',
        author: {
          did: 'did:plc:jb2q4yqmgpmefxd4xx66gepm',
          handle: 'visionprofan.bsky.social',
          displayName: 'Visionary',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:jb2q4yqmgpmefxd4xx66gepm/bafkreibqdpwilgj43m37ksjilzcnzqx2g3njcyiyifvazdar23rs5hlokm@jpeg',
          associated: {
            chat: {
              allowIncoming: 'following',
            },
          },

          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3kcvvfzq6o32a',
            followedBy:
              'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.graph.follow/3jwawchotz22h',
          },
          labels: [
            {
              cts: '2024-07-14T04:31:55.599Z',
              src: 'did:plc:skibpmllbhxvbvwgtjxl3uao',
              uri: 'did:plc:jb2q4yqmgpmefxd4xx66gepm',
              val: 'cringe',
              ver: 1,
            },
          ],
          createdAt: '2023-04-13T05:48:48.827Z',
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T16:40:22.205Z',
          embed: {
            $type: 'app.bsky.embed.record',
            record: {
              cid: 'bafyreif6ks7dhjrgrio5guztdhf3byoygbwebbvehi4al2c5kmkevlqdky',
              uri: 'at://did:plc:4llrhdclvdlmmynkwsmg5tdc/app.bsky.feed.post/3lnfspxzdd42p',
            },
          },
          langs: ['en'],
          text: 'Just got my Vision Pro! 🤯\n\nAny recommendations for apps to try out?',
        },
        embed: {
          $type: 'app.bsky.embed.record#view',
          record: {
            $type: 'app.bsky.embed.record#viewRecord',
            uri: 'at://did:plc:4llrhdclvdlmmynkwsmg5tdc/app.bsky.feed.post/3lnfspxzdd42p',
            cid: 'bafyreif6ks7dhjrgrio5guztdhf3byoygbwebbvehi4al2c5kmkevlqdky',
            author: {
              did: 'did:plc:4llrhdclvdlmmynkwsmg5tdc',
              handle: 'atrupar.com',
              displayName: 'Aaron Rupar',
              avatar:
                'https://cdn.bsky.app/img/avatar/plain/did:plc:4llrhdclvdlmmynkwsmg5tdc/bafkreibmhm3h6ar52pogvolisrzjdhwa2myras5vkxzj67twxn2l6pogwu@jpeg',
              associated: {
                chat: {
                  allowIncoming: 'following',
                },
              },
              viewer: {
                muted: false,
                blockedBy: false,
                following:
                  'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3l7eals2t4g2k',
              },
              labels: [],
              createdAt: '2023-04-28T00:47:57.437Z',
            },
            value: {
              $type: 'app.bsky.feed.post',
              createdAt: '2025-04-22T13:43:36.261Z',
              embed: {
                $type: 'app.bsky.embed.video',
                alt: '',
                aspectRatio: {
                  height: 720,
                  width: 1280,
                },
                captions: [
                  {
                    $type: 'app.bsky.embed.video#caption',
                    file: {
                      $type: 'blob',
                      ref: {
                        $link:
                          'bafkreihm7npnefqxqmn7d45lcbxzn4wnowc2abe5hxmd63qlob7fbszola',
                      },
                      mimeType: 'text/vtt',
                      size: 1339,
                    },
                    lang: 'en',
                  },
                ],
                video: {
                  $type: 'blob',
                  ref: {
                    $link:
                      'bafkreihovdkyvql2yswuimm5m35lqyo7tgsfiujm7vrxtfmi4gwej4hkpa',
                  },
                  mimeType: 'video/mp4',
                  size: 6026932,
                },
              },
              facets: [],
              langs: ['en'],
              text: 'Austin Scott previews how House Rs plan to cut Medicaid: "The federal govt is paying 90% of the Medicaid expansion. What we\'ve talked about is moving that 90% level of the expansion back... nobody would be kicked off Medicaid as long as governors decided they wanted to continue to fund the program"',
            },
            labels: [],
            likeCount: 880,
            replyCount: 230,
            repostCount: 347,
            quoteCount: 145,
            indexedAt: '2025-04-22T13:43:37.350Z',
            embeds: [
              {
                $type: 'app.bsky.embed.video#view',
                cid: 'bafkreihovdkyvql2yswuimm5m35lqyo7tgsfiujm7vrxtfmi4gwej4hkpa',
                playlist:
                  'https://video.bsky.app/watch/did%3Aplc%3A4llrhdclvdlmmynkwsmg5tdc/bafkreihovdkyvql2yswuimm5m35lqyo7tgsfiujm7vrxtfmi4gwej4hkpa/playlist.m3u8',
                thumbnail:
                  'https://video.bsky.app/watch/did%3Aplc%3A4llrhdclvdlmmynkwsmg5tdc/bafkreihovdkyvql2yswuimm5m35lqyo7tgsfiujm7vrxtfmi4gwej4hkpa/thumbnail.jpg',
                alt: '',
                aspectRatio: {
                  height: 720,
                  width: 1280,
                },
              },
            ],
          },
        },
        replyCount: 11,
        repostCount: 97,
        likeCount: 399,
        quoteCount: 3,
        indexedAt: '2025-04-22T16:40:22.648Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: 'at://did:plc:5o6k7jvowuyaquloafzn3cfw/app.bsky.feed.post/3lng6lkuhxc2s',
        cid: 'bafyreifwapmjx76kz5lkoeejfoes4ct2xhyycfyxwccmyr3mtxht5juyli',
        author: {
          did: 'did:plc:5o6k7jvowuyaquloafzn3cfw',
          handle: 'johndoe.org',
          displayName: 'John Doe',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:5o6k7jvowuyaquloafzn3cfw/bafkreierrwtdsf5quwprs2xqmmh2lu2k7au2cibyegfpard6wqyjs7nd6i@jpeg',

          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3kcvvfzq6o32a',
            followedBy:
              'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.graph.follow/3jwawchotz22h',
          },
          labels: [],
          createdAt: '2023-05-16T02:37:39.269Z',
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T17:15:53.178Z',
          langs: ['en'],
          text: "I'm running out of ideas for these fake posts. Alas, such is the demands of modern life. Do you like blueberries? Just remembered that blueberries are delicious! They're so tasty! I can't wait to try them!",
        },
        replyCount: 13,
        repostCount: 121,
        likeCount: 345,
        quoteCount: 6,
        indexedAt: '2025-04-22T17:15:53.351Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: 'at://did:plc:5ywatwbfxoecxgb4xq6ods72/app.bsky.feed.post/3lng5w2fbvs2g',
        cid: 'bafyreigi7d57fudzoybe4u6w7friw6ydz3pmzrdu3bvjwb5mvsvlprk23y',
        author: {
          did: 'did:plc:5ywatwbfxoecxgb4xq6ods72',
          handle: 'cooking.bsky.social',
          displayName: 'cooking tips',
          avatar:
            'https://cdn.bsky.app/img/avatar/plain/did:plc:5ywatwbfxoecxgb4xq6ods72/bafkreibbsuyy25elibbys5vx25cnkcs6g4ih6dozypa4bomwhkwsi6f5wa@jpeg',

          viewer: {
            muted: false,
            blockedBy: false,
            following:
              'at://did:plc:p2cp5gopk7mgjegy6wadk3ep/app.bsky.graph.follow/3kcvvfzq6o32a',
            followedBy:
              'at://did:plc:vwzwgnygau7ed7b7wt5ux7y2/app.bsky.graph.follow/3jwawchotz22h',
          },
          labels: [],
          createdAt: '2024-05-28T00:18:08.531Z',
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: '2025-04-22T17:03:51.259Z',
          langs: ['en'],
          text: 'and another thing. I have more things to say. I think. I forget :/',
        },
        replyCount: 1,
        repostCount: 4,
        likeCount: 20,
        quoteCount: 0,
        indexedAt: '2025-04-22T17:03:52.050Z',
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
  ],
} satisfies AppBskyFeedGetFeed.OutputSchema

export const BOTTOM_BAR_AVI = 'https://bsky.social/about/hero-social-card.webp'
