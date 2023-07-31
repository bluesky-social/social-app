export const FEEDBACK_FORM_URL =
  "https://twitter.com/intent/tweet?text=Hey%20@solarplex_xyz%20I%20have%20some%20feedback%20for%20Live%3A";

export const BLUESKY_INTENT_LINK =
  "https://twitter.com/intent/tweet?text=Let%27s%20get%20out%20of%20the%20echo%20chamber%21%20I%27m%20on%20the%20waitlist%20for%20@solarplex_xyz%20Live%21%20I%20need%20a%20@bluesky%20invite%2C%20who%27s%20got%20one%3F";

export const MAX_DISPLAY_NAME = 64;
export const MAX_DESCRIPTION = 256;

export const MAX_GRAPHEME_LENGTH = 1000;

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 1000;

export function IS_LOCAL_DEV(url: string) {
  return url.includes("localhost");
}

export function IS_STAGING(url: string) {
  return !IS_LOCAL_DEV(url) && !IS_PROD(url);
}

export function IS_PROD(url: string) {
  // NOTE
  // until open federation, "production" is defined as the main server
  // this definition will not work once federation is enabled!
  // -prf
  return url.startsWith("https://live.solarplex.xyz");
}

export const PROD_TEAM_HANDLES = [
  "jay.bsky.social",
  "pfrazee.com",
  "divy.zone",
  "dholms.xyz",
  "why.bsky.world",
  "iamrosewang.bsky.social",
  "viksit.live.solarplex.xyz",
  "zayyan.live.solarplex.xyz",
];
export const STAGING_TEAM_HANDLES = [
  "arcalinea.staging.bsky.dev",
  "paul.staging.bsky.dev",
  "paul2.staging.bsky.dev",
];
export const DEV_TEAM_HANDLES = ["alice.test", "bob.test", "carla.test"];

export function TEAM_HANDLES(serviceUrl: string) {
  if (serviceUrl.includes("localhost")) {
    return DEV_TEAM_HANDLES;
  } else if (serviceUrl.includes("staging")) {
    return STAGING_TEAM_HANDLES;
  } else {
    return PROD_TEAM_HANDLES;
  }
}

export const STAGING_DEFAULT_FEED = (rkey: string) =>
  `at://did:plc:wqzurwm3kmaig6e6hnc2gqwo/app.bsky.feed.generator/${rkey}`;
export const PROD_DEFAULT_FEED = (rkey: string) =>
  `at://did:plc:4srpaai54v3d35bigtfbtbd5/app.bsky.feed.generator/${rkey}`;

export async function DEFAULT_FEEDS(
  serviceUrl: string,
  resolveHandle: (name: string) => Promise<string>,
) {
  if (IS_LOCAL_DEV(serviceUrl)) {
    // local dev
    const aliceDid = await resolveHandle("alice.test");
    return {
      pinned: [`at://${aliceDid}/app.bsky.feed.generator/alice-favs`],
      saved: [`at://${aliceDid}/app.bsky.feed.generator/alice-favs`],
    };
  } else if (IS_STAGING(serviceUrl)) {
    // staging
    return {
      pinned: [STAGING_DEFAULT_FEED("whats-hot")],
      saved: [
        STAGING_DEFAULT_FEED("bsky-team"),
        STAGING_DEFAULT_FEED("with-friends"),
        STAGING_DEFAULT_FEED("whats-hot"),
        STAGING_DEFAULT_FEED("hot-classic"),
      ],
    };
  } else {
    // production
    return {
      pinned: [
        PROD_DEFAULT_FEED("splx-solana"),
        PROD_DEFAULT_FEED("splx-solarplex"),
      ],
      saved: [
        PROD_DEFAULT_FEED("splx-solana"),
        PROD_DEFAULT_FEED("splx-solarplex"),
      ],
    };
  }
}

export const SOLARPLEX_IDENTIFIER = "solarplex.live.solarplex.xyz";
export const SOLARPLEX_APP_PASS = process.env.APP_PASS;

export const POST_IMG_MAX = {
  width: 2000,
  height: 2000,
  size: 1000000,
};

// TODO(viksit): what is this?
export const STAGING_LINK_META_PROXY =
  "https://cardyb.staging.bsky.dev/v1/extract?url=";

export const PROD_LINK_META_PROXY = "https://cardyb.bsky.app/v1/extract?url=";

export const SOLARPLEX_FEEDS = [
  "at://did:plc:4srpaai54v3d35bigtfbtbd5/app.bsky.feed.generator/splx-solana",
  "at://did:plc:4srpaai54v3d35bigtfbtbd5/app.bsky.feed.generator/splx-solarplex",
  "at://did:plc:4srpaai54v3d35bigtfbtbd5/app.bsky.feed.generator/wearesquidz",
];

export const SOLARPLEX_FEED_URI_PATH =
  "at://did:plc:4srpaai54v3d35bigtfbtbd5/app.bsky.feed.generator/";

export const SOLARPLEX_FEED_API = "https://feed.solarplex.xyz";
// export const SOLARPLEX_FEED_API = "http://localhost:3000";
export const SOLARPLEX_DID = "did:plc:4srpaai54v3d35bigtfbtbd5";

export function LINK_META_PROXY(serviceUrl: string) {
  if (IS_LOCAL_DEV(serviceUrl)) {
    return STAGING_LINK_META_PROXY;
  } else if (IS_STAGING(serviceUrl)) {
    return STAGING_LINK_META_PROXY;
  } else {
    return PROD_LINK_META_PROXY;
  }
}

export const DEFAULT_REACTION_EMOJIS = [
  // {
  //   id: 0,
  //   emoji:
  //     "https://s3.amazonaws.com/pix.iemoji.com/images/emoji/apple/ios-12/256/link.png",
  //   title: "like",
  // },
  // {
  //   id: 1,
  //   emoji: "🥰",
  //   title: "love",
  // },
  // {
  //   id: 2,
  //   emoji: "🤗",
  //   title: "care",
  // },
  // {
  //   id: 3,
  //   emoji: "😘",
  //   title: "kiss",
  // },
  {
    id: 0,
    emoji: "😂",
    title: "laugh",
    reaction_id: "784f0ff4-0ddb-456f-81c9-a3a4afd1e3cc"
  },
  {
    id: 1,
    emoji: "😎",
    title: "cool",
    reaction_id: "4aef38b4-5d8e-46ad-a640-7d2b8701b176"
  },
  {
    id: 2,
    emoji: "🤨",
    title: "eyebrow-raise",
    reaction_id: "0dc678ff-df89-44b6-9dc1-a0840751ba1f"
  },
  {
    id: 3,
    emoji: "😳",
    title: "blush",
    reaction_id: "0f213c05-4049-42bd-a712-0f17b597cbf5"
  },
  {
    id: 4,
    emoji: "🧟‍♂️",
    title: "zombie",
    reaction_id: "1c351241-b867-44c3-ac0b-06575f448ba0"
  },
  {
    id: 5,
    emoji: "😍",
    title: "heart-eyes",
    reaction_id: "26d4990d-71a0-4559-953e-2270d571de0c"
  },
  {
    id: 6,
    emoji: "🔥",
    title: "fire",
    reaction_id: "8b0738c5-6920-4cad-9f0b-0ae827bc65af"
  },
  {
    id: 7,
    emoji: "😭",
    title: "cry",
    reaction_id: "dcd4a47d-07a4-4013-8c0a-3a23b20965d8"
  },
  {
    id: 8,
    emoji: "❤️",
    title: "heart",
    reaction_id: "5769395c-0ed8-427f-b150-5482f55d2113"
  },
  {
    id: 9,
    emoji: "😀",
    title: "grin",
    reaction_id: "ae8e22bb-db3d-4a22-964b-9184dcc5c68d"
  },
];
