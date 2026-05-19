import {type BskyAgent} from '@atproto/api'

export const COMMUNITY_MEMBERSHIP_NSID = 'org.coseeker.community.membership'

export async function writeMembershipRecord(
  agent: BskyAgent,
  brandId: string,
): Promise<void> {
  if (!agent.did) {
    throw new Error('writeMembershipRecord: agent has no did')
  }
  await agent.com.atproto.repo.putRecord({
    repo: agent.did,
    collection: COMMUNITY_MEMBERSHIP_NSID,
    rkey: brandId,
    record: {
      $type: COMMUNITY_MEMBERSHIP_NSID,
      community: brandId,
      joinedAt: new Date().toISOString(),
    },
  })
}
