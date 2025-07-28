# Gander Social App

Welcome friends! This is the codebase for the Gander Social app.

Get the app itself:

- **Web: [gndr.app](https://gndr.app)**
- **iOS: [App Store](https://apps.apple.com/us/app/gander-social/id6444370199)**
- **Android: [Play Store](https://play.google.com/store/apps/details?id=xyz.ganderweb.app)**

## Development Resources

This is a [React Native](https://reactnative.dev/) application, written in the TypeScript programming language. It builds on the `gander-social-atproto` TypeScript packages (like [`@atproto/api`](https://www.npmjs.com/package/@atproto/api)), which are also open source, but in [a different git repository](https://github.com/gander-social/atproto).

There is a small amount of Go language source code (in `./gndrweb/`), for a web service that returns the React Native Web application.

The [Build Instructions](./docs/build.md) are a good place to get started with the app itself.

The Authenticated Transfer Protocol ("AT Protocol" or "gander-social-atproto") is a decentralized social media protocol. You don't *need* to understand AT Protocol to work with this application, but it can help. Learn more at:

- [Overview and Guides](https://atproto.com/guides/overview)
- [GitHub Discussions](https://github.com/gander-social/atproto/discussions) 👈 Great place to ask questions
- [Protocol Specifications](https://atproto.com/specs/atp)
- [Blogpost on self-authenticating data structures](https://gndr.social/about/blog/3-6-2022-a-self-authenticating-social-protocol)

The Gander Social application encompasses a set of schemas and APIs built in the overall AT Protocol framework. The namespace for these "Lexicons" is `app.gndr.*`.

## Contributions

> [!NOTE]
> While we do accept contributions, we prioritize high quality issues and pull requests. Adhering to the below guidelines will ensure a more timely review.

**Rules:**

- We may not respond to your issue or PR.
- We may close an issue or PR without much feedback.
- We may lock discussions or contributions if our attention is getting DDOSed.
- We're not going to provide support for build issues.

**Guidelines:**

- Check for existing issues before filing a new one please.
- Open an issue and give some time for discussion before submitting a PR.
- Stay away from PRs like...
  - Changing "Post" to "Skeet."
  - Refactoring the codebase, e.g., to replace React Query with Redux Toolkit or something.
  - Adding entirely new features without prior discussion. 

Remember, we serve a wide community of users. Our day-to-day involves us constantly asking "which top priority is our top priority." If you submit well-written PRs that solve problems concisely, that's an awesome contribution. Otherwise, as much as we'd love to accept your ideas and contributions, we really don't have the bandwidth. That's what forking is for!

## Forking guidelines

You have our blessing 🪄✨ to fork this application! However, it's very important to be clear to users when you're giving them a fork.

Please be sure to:

- Change all branding in the repository and UI to clearly differentiate from Gander.
- Change any support links (feedback, email, terms of service, etc) to your own systems.
- Replace any analytics or error-collection systems with your own so we don't get super confused.

## Security disclosures

If you discover any security issues, please send an email to security@gndr.app. The email is automatically CC'd to the entire team and we'll respond promptly.

## Are you a developer interested in building on gander-social-atproto?

Gander is an open social network built on the AT Protocol, a flexible technology that will never lock developers out of the ecosystems that they help build. With gander-social-atproto, third-party integration can be as seamless as first-party through custom feeds, federated services, clients, and more.

## License (MIT)

See [./LICENSE](./LICENSE) for the full license.

## P.S.

We ❤️ you and all of the ways you support us. Thank you for making Gander a great place!

## Upstream Package Switching

This project supports switching between upstream package sources for all AT Protocol-related packages (e.g. `@atproto`, `@atproto-labs`, `@gander-social-atproto`, `@gander-atproto-nest`).

### How to Change the Upstream Source

1. **Set the upstream source in your `.env` file:**
   - Add or update the following line:
     ```
     BUILD_UPSTREAM_SOURCE=bluesky
     ```
     - Use `bluesky` for the official upstream (`@atproto`, `@atproto-labs`).
     - Use `gander` for the Gander upstream (`@gander-social-atproto`, `@gander-atproto-nest`).
   - If not set, the default is `bluesky` (see `src/lib/constants.ts`).

2. **Run the import update script:**
   - From the project root, run:
     ```
     node scripts/switch-upstream.js [atproto|gander]
     ```
   - This will scan all source files and update import statements and package.json dependencies to use the correct upstream packages.

3. **(Optional) Add to your build/start process:**
   - To run automatically, add this to your `package.json` scripts:
     ```json
     "scripts": {
       "switch-upstream": "node scripts/switch-upstream.js [atproto|gander]",
       "start": "npm run switch-upstream && ..."
     }
     ```

### Notes
- The script will update all `.ts`, `.tsx`, `.js`, and `.jsx` files in main source folders.
- It will not touch generated files, test/mocks, or `node_modules`.
- You can run the script manually any time you change the upstream source.
- The default upstream is set in `src/lib/constants.ts` and can be overridden by your `.env` file.
