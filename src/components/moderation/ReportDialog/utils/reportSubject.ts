import {type com} from '#/lexicons'

/**
 * The `subject` union of the generated `createReport` input body. The lexicon
 * declares only `com.atproto.admin.defs#repoRef` and `com.atproto.repo.strongRef`
 * with branded string fields (`did: l.DidString`, `uri: l.AtUriString`,
 * `cid: l.CidString`).
 */
type ReportSubject = com.atproto.moderation.createReport.$InputBody['subject']

/** The repoRef arm of the subject union, carrying the branded `did`. */
type RepoRefSubject = Extract<
  ReportSubject,
  {$type: 'com.atproto.admin.defs#repoRef'}
>

/** The strongRef arm of the subject union, carrying the branded `uri`/`cid`. */
type StrongRefSubject = Extract<
  ReportSubject,
  {$type: 'com.atproto.repo.strongRef'}
>

/**
 * Branded repoRef subject from a plain did string. The app holds dids as plain
 * strings; brand the single field to the lexicon's `did` slot.
 */
export function accountReportSubject(did: string): ReportSubject {
  return {
    $type: 'com.atproto.admin.defs#repoRef',
    did: did as RepoRefSubject['did'],
  }
}

/**
 * Branded strongRef subject from plain uri/cid strings. The app holds these as
 * plain strings; brand `uri` to the lexicon's `uri` slot (`cid` is a plain
 * string in the generated type, so it needs no assertion).
 */
export function recordReportSubject(uri: string, cid: string): ReportSubject {
  return {
    $type: 'com.atproto.repo.strongRef',
    uri: uri as StrongRefSubject['uri'],
    cid,
  }
}

/**
 * Chat subjects (messageRef/convoRef) are accepted by the moderation service on
 * the wire but are not part of the `createReport` lexicon union. This is the ONE
 * place that asserts them into the body type - keep the runtime value exact.
 */
export function chatReportSubject(
  v:
    | {
        $type: 'chat.bsky.convo.defs#messageRef'
        messageId: string
        convoId: string
        did: string
      }
    | {$type: 'chat.bsky.convo.defs#convoRef'; convoId: string; did: string},
): ReportSubject {
  return v as unknown as ReportSubject
}
