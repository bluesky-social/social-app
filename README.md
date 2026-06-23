# Mu Social

Mu ([mu.social](https://mu.social)) is a web-app-only (for now, mobile apps work in progress) social application operated by Eurosky ([eurosky.tech](https://eurosky.tech)). 

This repository is a downstream fork of the [Bluesky social application](https://github.com/bluesky-social/social-app). While it maintains compatibility with the AT Protocol, it is specifically optimized and branded for the Mu experience.

## Relationship with Upstream

Mu is maintained by Eurosky and is not affiliated with Bluesky Social, PBC. This project tracks upstream changes from the original repository while applying custom branding, configuration, and web-specific optimizations. For the original application and mobile versions, please refer to the [official Bluesky repository](https://github.com/bluesky-social/social-app).

## Development Resources

This is a [React Native](https://reactnative.dev/) application, written in TypeScript, utilizing React Native Web. It builds on the `atproto` TypeScript packages (like [`@atproto/api`](https://www.npmjs.com/package/@atproto/api)), which are also open source, but in [a different git repository](https://github.com/bluesky-social/atproto).

The [Build Instructions](./docs/build.md) are a good place to get started with the app itself.

Mu is deployed on bunny.net as a SPA with some edge functions for different services (see `services/`).

The Authenticated Transfer Protocol ("AT Protocol" or "atproto") is a decentralized social media protocol. Learn more at:

- [Overview and Guides](https://atproto.com/guides/overview)
- [Protocol Specifications](https://atproto.com/specs/atp)

## Contributions

Eurosky accepts contributions that improve the Mu web experience. Please follow these guidelines:

- **Focus:** We prioritize high-quality issues and pull requests that align with our web-only focus.
- **Discussion:** Open an issue to discuss significant changes before submitting a PR.
- **Branding:** Ensure all contributions respect the Mu branding guidelines.

branch `main` tracks upstream, our default branch is `eurosky/fork`, please open PRs to that branch (will also run a deploy to https://staging.mu.social), for prod deployment merge `eurosky/fork` into `eurosky/deploy`. 

## Security Disclosures

If you discover any security issues related specifically to Mu's deployment or modifications, please contact the Eurosky team. For protocol-level security issues, please follow the [official AT Protocol disclosure process](https://github.com/bluesky-social/atproto).

## License (MIT)

See [./LICENSE](./LICENSE) for the full license. This project is licensed under the MIT License, following the upstream repository's licensing.
