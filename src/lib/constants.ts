export const FEEDBACK_FORM_URL =
  "https://twitter.com/intent/tweet?text=Hey%20@solarplex_xyz%20I%20have%20some%20feedback%20for%20Live%3A";

export const BLUESKY_INTENT_LINK =
  "https://twitter.com/intent/tweet?text=Let%27s%20get%20out%20of%20the%20echo%20chamber%21%20I%27m%20on%20the%20waitlist%20for%20@solarplex_xyz%20Live%21%20I%20need%20a%20@bluesky%20invite%2C%20who%27s%20got%20one%3F";

export const MAX_DISPLAY_NAME = 64;
export const MAX_DESCRIPTION = 256;

export const MAX_GRAPHEME_LENGTH = 300;

// Recommended is 100 per: https://www.w3.org/WAI/GL/WCAG20/tests/test3.html
// but increasing limit per user feedback
export const MAX_ALT_TEXT = 300;

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
// export const SOLARPLEX_V1_API = "http://localhost:3001";
export const SOLARPLEX_V1_API = "https://prod.api.solarplex.xyz";
export const HELIUS_RPC_API = "https://rpc.helius.xyz/";
export const DEVNET_HELIUS_RPC_API = "https://devnet.helius-rpc.com";

export const GENESIS_COLLECTION =
  "HZ3LkMKWDWDREPqjtBHkQGz3nzckdRBjSh9bTiud5pVU";

export function LINK_META_PROXY(serviceUrl: string) {
  if (IS_LOCAL_DEV(serviceUrl)) {
    return STAGING_LINK_META_PROXY;
  } else if (IS_STAGING(serviceUrl)) {
    return STAGING_LINK_META_PROXY;
  } else {
    return PROD_LINK_META_PROXY;
  }
}

// TODO(zfaizal2): eventually move this to an API call
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
    reaction_id: "784f0ff4-0ddb-456f-81c9-a3a4afd1e3cc",
  },
  {
    id: 1,
    emoji: "😎",
    title: "cool",
    reaction_id: "4aef38b4-5d8e-46ad-a640-7d2b8701b176",
  },
  {
    id: 2,
    emoji: "🤨",
    title: "eyebrow-raise",
    reaction_id: "0dc678ff-df89-44b6-9dc1-a0840751ba1f",
  },
  {
    id: 3,
    emoji: "😳",
    title: "blush",
    reaction_id: "0f213c05-4049-42bd-a712-0f17b597cbf5",
  },
  {
    id: 4,
    emoji: "🧟‍♂️",
    title: "zombie",
    reaction_id: "1c351241-b867-44c3-ac0b-06575f448ba0",
  },
  {
    id: 5,
    emoji: "😍",
    title: "heart-eyes",
    reaction_id: "26d4990d-71a0-4559-953e-2270d571de0c",
  },
  {
    id: 6,
    emoji: "🔥",
    title: "fire",
    reaction_id: "8b0738c5-6920-4cad-9f0b-0ae827bc65af",
  },
  {
    id: 7,
    emoji: "😭",
    title: "cry",
    reaction_id: "dcd4a47d-07a4-4013-8c0a-3a23b20965d8",
  },
  {
    id: 8,
    emoji: "❤️",
    title: "heart",
    reaction_id: "5769395c-0ed8-427f-b150-5482f55d2113",
  },
  {
    id: 9,
    emoji: "😀",
    title: "grin",
    reaction_id: "ae8e22bb-db3d-4a22-964b-9184dcc5c68d",
  },
];

export const SQUID_REACTION_EMOJIS = [
  {
    id: 0,
    emoji: "https://i.ibb.co/KwjKZzr/blob.png",
    title: "cool",
    reaction_id: "21542e72-5c22-47c0-a2b6-1cf4d0a69470",
  },
  {
    id: 1,
    emoji: "https://i.ibb.co/WnTZN9P/blob.png",
    title: "eyebrow-raise",
    reaction_id: "9c1a6723-21eb-4718-8e5a-1b5268120633",
  },
  {
    id: 2,
    emoji: "https://i.ibb.co/NVjhCtf/blob.png",
    title: "blush",
    reaction_id: "9ba9602c-c5ea-4fdc-9786-08aebb17b29f",
  },
  {
    id: 3,
    emoji: "https://i.ibb.co/FzqjJ6w/blob.png",
    title: "zombie",
    reaction_id: "b4e46fc8-3b60-485a-ade1-2433fe85d177",
  },
  {
    id: 4,
    emoji: "https://i.ibb.co/jJ7ry8y/blob.png",
    title: "heart-eyes",
    reaction_id: "812b63bf-730d-4097-a762-e656f6b",
  },
  {
    id: 5,
    emoji: "https://i.ibb.co/HtCbMQC/blob.png",
    title: "fire",
    reaction_id: "86760b8e-e2a5-4e7b-9b33-0a1a715feaa1",
  },
  {
    id: 6,
    emoji: "https://i.ibb.co/r359Sdw/blob.png",
    title: "cry",
    reaction_id: "c5a27756-e45a-461a-84ca-6c53155d1d3c",
  },
  {
    id: 7,
    emoji: "https://i.ibb.co/SxrRPX9/blob.png",
    title: "love",
    reaction_id: "5b325419-d289-4223-b62d-34a82dba848f",
  },
  {
    id: 8,
    emoji: "https://i.ibb.co/9wjtdSg/blob.png",
    title: "laugh",
    reaction_id: "eb3a0414-8ace-4be7-bd7a-aaf4d38d7230",
  },
  {
    id: 9,
    emoji: "https://i.ibb.co/Gs0nYmC/blob.png",
    title: "smile",
    reaction_id: "16e8d232-8e97-4f8d-83d5-ebf6060773c3",
  },
];

export const GENESIS_REACTIONS = [
  {
    id: 0,
    emoji: "https://i.ibb.co/51G4n88/blob.png",
    title: "Wink",
    reaction_id: "ff09346e-a4f8-4670-8044-5c62b4f72398",
    // reaction_id: "21542e72-5c22-47c0-a2b6-1cf4d0a69470",
  },
  {
    id: 1,
    emoji: "https://i.ibb.co/Bqw4mk2/blob.png",
    title: "Raare",
    reaction_id: "04076842-8299-45cc-9e95-0d6c601463e6",
    // reaction_id: "9c1a6723-21eb-4718-8e5a-1b5268120633",
  },
  {
    id: 2,
    emoji: "https://i.ibb.co/hMWqHm3/blob.png",
    title: "Happy",
    reaction_id: "565b4bdd-df1b-4f22-9204-375f2575ed59",
  },
  {
    id: 3,
    emoji: "https://i.ibb.co/dfchfDb/blob.png",
    title: "Frown",
    reaction_id: "test",
  },
  {
    id: 4,
    emoji: "https://i.ibb.co/dpQhwjc/blob.png",
    title: "Blush",
    reaction_id: "f1fd45d6-7fd8-41b0-a80a-2b0601b05b19",
  },
  {
    id: 5,
    emoji: "https://i.ibb.co/1vg3dMB/blob.png",
    title: "Sad",
    reaction_id: "77d1f411-a704-4a5e-b0c5-0274e91d3fd4",
  },
  {
    id: 6,
    emoji: "https://i.ibb.co/VgwgKgk/blob.png",
    title: "Crying-Laughing",
    reaction_id: "9f40c618-551f-47c6-b66c-a7070726bf83",
  },
  {
    id: 7,
    emoji: "https://i.ibb.co/P9G9Hy0/blob.png",
    title: "Sunglasses",
    reaction_id: "06815558-1e25-40bc-8a57-127ca991d69d",
  },
  {
    id: 8,
    emoji: "https://i.ibb.co/LRX0s6Y/blob.png",
    title: "Heart-Eyes",
    reaction_id: "8ae3ecaa-3a5d-43ab-8705-041f4aacede0",
  },
  {
    id: 9,
    emoji: "https://i.ibb.co/qD5mwJk/blob.png",
    title: "Love",
    reaction_id: "f9c88519-feec-48de-a65f-639dd12b30f1",
  },
  {
    id: 10,
    emoji: "https://i.ibb.co/0yRy3sB/blob.png",
    title: "Dead",
    reaction_id: "bcad7ddd-8d1f-4b9a-86f5-4bc90ca2292a",
  },
];
