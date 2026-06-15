# CoSeeker Social App

CoSeeker is an open-source social app being developed within the larger K4M2A ecosystem.

The goal of this repository is to build digital infrastructure for seekers, teachers, philosophical communities, and people working toward inner transformation, wisdom, and human development.

This project is based on the Bluesky social app and the AT Protocol. We are adapting it into a CoSeeker-compatible app with a different purpose: not engagement maximization, but reflection, learning, community, and awakening.

## K4M2A Ecosystem

K4M2A is the larger open-source ecosystem for human awakening, inner transformation, philosophical depth, and collective harmony.

CoSeeker is one current application within the K4M2A ecosystem.

Over time, K4M2A may include multiple open-source apps, tools, platforms, learning systems, community infrastructure, research projects, and governance frameworks.

This repository is specifically for the CoSeeker social app.

## Current Focus

We are currently working on:

* Replacing Bluesky-specific branding with CoSeeker branding
* Making search and discovery relevant to CoSeeker users
* Improving anti-spam and moderation flows
* Improving names, profiles, onboarding, and identity
* Creating safer spaces for seekers, teachers, and communities
* Improving documentation so new contributors can participate easily

## Project Principles

CoSeeker should be built around:

* Human development
* Inner transformation
* Reflection
* Learning
* Community
* Wisdom
* Safety
* Open-source collaboration

CoSeeker should avoid addictive engagement mechanics, manipulative growth loops, outrage-maximizing feeds, and design patterns that undermine user dignity or well-being.

## Development Resources

This is a [React Native](https://reactnative.dev/) application written in TypeScript.

It builds on the AT Protocol TypeScript packages, including [`@atproto/api`](https://www.npmjs.com/package/@atproto/api). The AT Protocol packages are open source and maintained in a separate repository:

* [AT Protocol GitHub Repository](https://github.com/bluesky-social/atproto)

There is also a small amount of Go source code in `./bskyweb/`, used for a web service that returns the React Native Web application.

The [Build Instructions](./docs/build.md) are the best place to get started with local development.

## About AT Protocol

The Authenticated Transfer Protocol, also called AT Protocol or atproto, is a decentralized social media protocol.

You do not need to understand AT Protocol deeply to make small contributions to this app, but it can help.

Useful resources:

* [AT Protocol Overview and Guides](https://atproto.com/guides/overview)
* [AT Protocol Specifications](https://atproto.com/specs/atp)
* [AT Protocol GitHub Discussions](https://github.com/bluesky-social/atproto/discussions)
* [Blog post on self-authenticating data structures](https://bsky.social/about/blog/3-6-2022-a-self-authenticating-social-protocol)

## Relationship to Bluesky

This repository is based on the Bluesky social app.

CoSeeker is not Bluesky. It is a K4M2A project that uses the Bluesky social app codebase and AT Protocol ecosystem as a technical foundation.

During the transition, some files, comments, links, screens, packages, or internal names may still refer to Bluesky, `bsky`, or `app.bsky.*`. Part of the current work is to identify what should remain for protocol compatibility and what should be changed for CoSeeker identity, configuration, and user experience.

## Contributing

We welcome contributors.

Start here:

* Read [`CONTRIBUTING.md`](./CONTRIBUTING.md)
* Review the [`ROADMAP.md`](./ROADMAP.md)
* Follow the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)
* Look for issues labeled `good first issue` or `help wanted`

If you want to work on an issue, comment:

```text
I would like to work on this.
```

A maintainer will confirm before you begin.

## Good First Contributions

Good first contributions may include:

* Replacing outdated Bluesky-specific text with CoSeeker text
* Fixing broken or incorrect links
* Improving documentation
* Testing onboarding, profile, search, and settings flows
* Reporting bugs with clear reproduction steps
* Improving user-facing copy
* Improving small UI details
* Helping identify where branding should become configurable

Please keep pull requests small and focused.

## Contribution Guidelines

Before opening a pull request:

* Check whether a related issue already exists
* Open an issue first for larger changes
* Avoid unrelated refactoring
* Avoid changing large parts of the app without discussion
* Include screenshots or screen recordings for UI changes
* Explain what changed and why
* Test the affected flow when possible

Maintainers may ask for changes before merging a pull request.

## Roadmap

The current roadmap includes:

1. CoSeeker identity and branding
2. CoSeeker search and discovery
3. Safety, moderation, and anti-spam
4. Community infrastructure
5. Anti-engagement social design
6. Open-source ecosystem development

See [`ROADMAP.md`](./ROADMAP.md) for more details.

## Security Disclosures

If you discover a security issue, please do not open a public GitHub issue with sensitive details.

Use GitHub private vulnerability reporting if available, or contact the maintainers through an official K4M2A communication channel.

Public issues are fine for normal bugs, UI problems, documentation problems, and non-sensitive technical issues.

## License

This project is licensed under the MIT License.

See [`LICENSE`](./LICENSE) for the full license.

## Upstream Attribution

This project is based on the Bluesky social app codebase.

Bluesky Social PBC has committed to a software patent non-aggression pledge. For details, see the original announcement:

* [Bluesky patent pledge](https://bsky.social/about/blog/10-01-2025-patent-pledge)

We are grateful to the Bluesky and AT Protocol ecosystem for making this foundation available for open-source development.
