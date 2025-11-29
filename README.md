# blacksky.community

**blacksky.community** is a community-driven fork of the official Bluesky Social client.  
It’s the **primary client for the Blacksky community**, maintained *by and for* our members.  
We track upstream releases closely but layer on features and policies that reflect Blacksky’s
values of safety, autonomy, and collective ownership.

> 🗳 **Have feedback?** Join the open conversation on Blacksky People’s Assembly: <https://assembly.blacksky.community/8bbfunvvau>

---

## Get the app

| Platform | Link | Status |
|----------|------|--------|
| **Web**  | <https://blacksky.community> | ✅ Live |
| **iOS**  | *(App Store link forthcoming)* | 🛠 WIP |
| **Android** | *(Play Store link forthcoming)* | 🛠 WIP |

---

## Features — Today

Blacksky ships everything you expect from the upstream Bluesky client **plus** community-specific defaults:

| Area | Additions |
|------|-----------|
| **Safety & Moderation** | • **@blacksky.app** moderation service is the default **and cannot be disabled**, providing strong anti-harassment filtering out-of-the-box |
| **Feed Control** | • **Blacksky: Trending** feed replaces Discover as the landing feed |
| **On-boarding** | • New users sign up on the **Blacksky PDS** and receive `*.blacksky.app` handles |

### WIP / Planned

- Private, community-only posts, [similar to Hometown](https://github.com/hometown-fork/hometown/wiki/Local-only-posting)

---

## Philosophy

- **Familiar, but unmistakably Blacksky** – default behaviour mirrors the official client so new
  users feel at home, while branding and safety defaults make it clear you’re on Blacksky.
- **Community governance** – major feature decisions and policy changes are discussed on Polis and
  implemented transparently.

---

## Development Resources

This is a **[React Native](https://reactnative.dev/)** project in **TypeScript**.  
It depends on the open-source **AT Protocol** packages (e.g. [`@atproto/api`](https://npm.im/@atproto/api)).  
A vestigial Go service in `./bskyweb/` can serve a React Native Web build, but we deploy the web
front-end as static files (currently via Cloudflare Pages).

See **[docs/build.md](./docs/build.md)** for local setup. Nix users can leverage `flake.nix` for a
one-command dev shell.

Helpful AT Protocol links:

- Overview & Guides – <https://atproto.com/guides/overview>
- GitHub Discussions – <https://github.com/bluesky-social/atproto/discussions>
- Protocol Specs – <https://atproto.com/specs/atp>

---

## Contributions

> We ❤️ thoughtful contributions! Help us keep the diff small and the community safe.

**Rules**

- We may decline or delay PRs that are too large to maintain.
- We reserve the right to lock heated threads to protect contributors’ time.

**Guidelines**

1. **Open an issue first** – give the community time to discuss scope & maintenance.
2. **Prefer small patches** – anything that touches lots of upstream code is hard to carry.
3. **Put opinionated changes behind toggles**.
4. Avoid PRs that…
  - Rename common terms (e.g., “Post” → “Skeet”)
  - Replace core libraries without strong need (e.g., MobX → Redux)
  - Add entirely new features with no prior discussion

If your idea isn’t a fit, feel free to **fork** – that’s the beauty of open source!

---

## Forking Guidelines

- Re-brand clearly so users don’t confuse your fork with blacksky.community.
- Point analytics / error reporting to **your** endpoints.
- Update support links (feedback, email, terms, etc.) to your own.

---

## Security Disclosures

Found a vulnerability?  
Email **rudy@blacksky.app** – we will respond
promptly.

---

## License

**MIT** – see [./LICENSE](./LICENSE).

---

Bluesky Social PBC has committed to a software patent non-aggression pledge. For details see [the original announcement](https://bsky.social/about/blog/10-01-2025-patent-pledge).

## P.S.

Blacksky exists because of contributors like *you*.  
Thank you for helping us build safer, community-owned social media!