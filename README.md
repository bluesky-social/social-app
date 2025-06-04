# blacksky.community

This is a soft fork of [social app](https://github.com/bluesky-social/social-app).

Get the app itself:

- **Web: [blacksky.community](https://blacksky.community)**
- ~**iOS: [App Store]()**~ WIP
- ~**Android: [Play Store]()**~ WIP

## Features Today

- toggle to disable go.bsky.app link proxying for analytics
- toggle to disable default app labeler
- toggle to disable falling back to discover feed in the following feed
- see through quote blocks and detatchments (nuclear block wrt quotes)
  - <img src="https://github.com/user-attachments/assets/e5084afd-b17e-43a7-9622-f6d7f19f53ca" width="300px" />
- enable features gates
- configure the location used to determine regional labelers
- entirely ignore `!no-unauthenticated` labels, even for logged out users

### WIP/Planned

- rewrite shared URLs to reference blacksky.community
- opengraph support for sharing posts and profiles
- selecting custom appviews
- seeing past blocks in post threads (nuclear block for reply chains)

## Philosophy

- by default, blacksky.community should very similar to the official client
  - color and branding are different to distinguish from social-app
  - `!no-unauthenticated` behavior is different
  - analytics are not present
- opinionated features behind toggles
- focus on high impact, low diff size patches
  - specifically patches that won't require large conflicts to be resolved
- focus on power users (but all users are welome!)
- enable things that are possible but annoying today **without** egging on antisocial behavior

## Development Resources

This is a [React Native](https://reactnative.dev/) application, written in the TypeScript programming language. It builds on the `atproto` TypeScript packages (like [`@atproto/api`](https://www.npmjs.com/package/@atproto/api)), code for which is also open source, but in [a different git repository](https://github.com/bluesky-social/atproto). It is regularly rebased
on top of new releases of [social-app](https://github.com/bluesky-social/social-app).

There is vestigial Go language source code (in `./bskyweb/`), for a web service that returns the React Native Web application in the social app deployment. However, it is not used in current
blacksky.community deployments.
For blacksky, the intended deployment is with a websever than can serve static files, and reroute to `index.html` as needed. Today [blacksky.community](https://blacksky.community) is hosted on [cloudflare pages](https://pages.cloudflare.com/).

The [Build Instructions](./docs/build.md) are a good place to get started with the app itself. If you use nix (and especially direnv) then `flake.nix` will get you a working environment for
the web version of the app.

The Authenticated Transfer Protocol ("AT Protocol" or "atproto") is a decentralized social media protocol. You don't *need* to understand AT Protocol to work with this application, but it can help.
You may wish to reference [resources linked in social-app](https://github.com/bluesky-social/social-app#development-resources). However, please don't harass the Bluesky team with issues or questions
pertaining to blacksky.community.

Blacksky is a fork of the official client, social-app. It encompasses a set of schemas and APIs built in the overall AT Protocol framework. The namespace for these "Lexicons" is `app.bsky.*`.

## Contributions

> blacksky.community is a community fork, and we'd love to merge your PR!

As a rule of thumb, the best features for blacksky.community are ones that have a disproportionately positive impact on the user experience compared to the matinance overhead.
Unlike some open source projects, since blacksky.community is a soft fork, any features (patches) we add on top of upstream social-app need to be maintained. For example,
a change to the way posts are composed may be very invasive, touching lots of code across the codebase. If upstream refactors this component, we will need to rewrite this
feature to be compatible or drop it from the client.

For this reason, bias towards features that change a relatively small amount of code that is present upstream.

Without an overriding motivation, opinionated features should exist behind a toggle that is not enabled by default. This allows blacksky.community to cater to as many users as possible.

**Guidelines:**

- Check for existing issues before filing a new one please.
- Open an issue and give some time for discussion before submitting a PR.
  - This isn't strictly necessary, but I'd love to give my thoughts and scope out your willingness to maintain the feature before you write it.
- Stay away from PRs like...
  - Changing "Post" to "Skeet."
  - Refactoring the codebase, e.g., to replace MobX with Redux or something.
- Include a new toggle and preference for your feature.

If we don't merge your PR for whatever reason, you are welcome to fork and/or self host:

## Forking guidelines

Just like social-app, you have our blessing 🪄✨ to fork this application! However, it's very important to be clear to users when you're giving them a fork.

Please be sure to:

- Change all branding in the repository and UI to clearly differentiate from blacksky.community.
- Change any support links (feedback, email, terms of service, issue tracker, etc) to your own systems.

## Self hosting & personal builds

Self hosting is great! It is our intention that blacksky.community is easy to self host and build on your own. If you host your own instance of blacksky.community, or make your own builds, please
make some level of effort to clarify that it is not an "official" build or instance. This can be in the form of a different domain or branding, but can also be as simple as not
advertising your hosted instance or builds as "official" releases. 

## Security disclosures

If you discover any security issues, please send an email to aviva@rubenfamily.com.
If the issue pertains to infastructure, code, or systems outside the scope of blacksky.community, please refer to the
[disclosure guidelines on social-app](https://github.com/bluesky-social/social-app#security-disclosures) if it is hosted by Bluesky PBC. Otherwise, reference the
security policy of that system as applicable <3

## License (MIT)

See [./LICENSE](./LICENSE) for the full license.
