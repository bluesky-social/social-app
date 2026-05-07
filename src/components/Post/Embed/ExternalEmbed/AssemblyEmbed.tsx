import {useCallback, useEffect, useState} from 'react'
import {Image, Linking, Pressable, StyleSheet, View} from 'react-native'
import {type AppBskyEmbedExternal} from '@atproto/api'

import {type EmbedPlayerParams} from '#/lib/strings/embed-player'
import {useAgent, useSession} from '#/state/session'
import {Logo as BlackskyLogo} from '#/view/icons/Logo'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const ASSEMBLY_API = 'https://assembly.blacksky.community/api/v3'

interface Statement {
  tid: number
  txt: string
  remaining?: number
  author_name?: string
  author_avatar?: string
  author_is_blacksky_member?: boolean
  author_is_funder?: boolean
  author_is_team?: boolean
  author_is_oss_supporter?: boolean
  at_uri?: string
  at_cid?: string
}

interface ConversationMeta {
  conversation_id: string
  topic: string
  description?: string
  is_active: boolean
  auth_needed_to_vote: boolean
  at_uri?: string
  at_cid?: string
}

interface EmbedConversationResponse {
  conversation: ConversationMeta
  nextComment: Statement | null
}

interface ParticipationInitResponse {
  auth?: {token: string}
  nextComment?: Statement
}

interface VoteResponse {
  auth?: {token: string}
  nextComment?: Statement
}

function extractConversationId(uri: string): string {
  try {
    const url = new URL(uri)
    return url.pathname.slice(1)
  } catch {
    return ''
  }
}

export function AssemblyEmbed({
  link,
}: {
  link: AppBskyEmbedExternal.ViewExternal
  params: EmbedPlayerParams
}) {
  const t = useTheme()
  const agent = useAgent()
  const {currentAccount} = useSession()
  const conversationId = extractConversationId(link.uri)

  const [data, setData] = useState<EmbedConversationResponse | null>(null)
  const [statement, setStatement] = useState<Statement | null>(null)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allVoted, setAllVoted] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [participationToken, setParticipationToken] = useState<string | null>(
    null,
  )

  const isAuthenticated = !!currentAccount?.did

  useEffect(() => {
    if (!conversationId) return

    const init = async () => {
      // 1. Fetch conversation data (public endpoint, CORS-safe)
      try {
        const convResp = await fetch(
          `${ASSEMBLY_API}/embed/conversation?conversation_id=${conversationId}`,
        )
        if (!convResp.ok) {
          if (convResp.status === 400 || convResp.status === 404) {
            setNotFound(true)
          }
          return
        }
        const convData = (await convResp.json()) as EmbedConversationResponse
        setData(convData)
        setStatement(convData.nextComment)
        if (!convData.nextComment) setAllVoted(true)
        if (!convData.conversation.is_active) return
      } catch {
        setError('Failed to load conversation')
        return
      }

      // 2. If authenticated, try to get a participation JWT (separate try/catch — non-fatal)
      if (isAuthenticated && currentAccount?.did) {
        try {
          const xidParams = new URLSearchParams({
            conversation_id: conversationId,
            includePCA: 'false',
            xid: currentAccount.did,
          })

          const initResp = await fetch(
            `${ASSEMBLY_API}/participationInit?${xidParams.toString()}`,
          )

          if (initResp.ok) {
            const initData =
              (await initResp.json()) as ParticipationInitResponse

            if (initData.auth?.token) {
              setParticipationToken(initData.auth.token)
            }

            // Use personalized next comment (excludes already-voted)
            if (initData.nextComment) {
              setStatement(initData.nextComment)
            } else {
              // User has voted on all statements
              setStatement(null)
              setAllVoted(true)
            }
          }
        } catch {
          // participationInit failed (likely CORS) — continue with public data
        }
      }
    }

    void init()
  }, [conversationId, isAuthenticated, currentAccount?.did])

  const handleVote = useCallback(
    async (value: -1 | 0 | 1) => {
      if (!statement || voting) return
      setVoting(true)
      setError(null)

      try {
        let voteAtUri: string | undefined

        // If authenticated and statement has an AT URI, create a signed vote
        // record in the user's repo as proof of identity.
        if (agent.session && statement.at_uri && statement.at_cid) {
          const createResult = await agent.com.atproto.repo.createRecord({
            repo: agent.assertDid,
            collection: 'community.blacksky.assembly.vote',
            record: {
              $type: 'community.blacksky.assembly.vote',
              subject: {
                uri: statement.at_uri,
                cid: statement.at_cid,
              },
              value,
              createdAt: new Date().toISOString(),
            },
          })
          voteAtUri = createResult.data.uri
        }

        // Submit to assembly's verified vote endpoint.
        // If authenticated: server fetches the record from user's PDS to verify.
        // If anonymous: server accepts the vote directly (conversation allows it).
        const voteHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (participationToken) {
          voteHeaders.Authorization = `Bearer ${participationToken}`
        }
        const voteResp = await fetch(`${ASSEMBLY_API}/embed/vote`, {
          method: 'POST',
          headers: voteHeaders,
          body: JSON.stringify({
            conversation_id: conversationId,
            tid: statement.tid,
            vote: value,
            ...(voteAtUri ? {vote_at_uri: voteAtUri} : {}),
          }),
        })

        if (!voteResp.ok) {
          const errBody = await voteResp.text()
          if (errBody.includes('polis_err_post_votes_social_needed')) {
            setError('Sign in required to vote.')
          } else {
            throw new Error('Vote submission failed')
          }
          return
        }

        const voteResult = (await voteResp.json()) as VoteResponse

        if (voteResult.nextComment) {
          setStatement(voteResult.nextComment)
        } else {
          setAllVoted(true)
          setStatement(null)
        }
      } catch {
        setError('Vote failed. Please try again.')
      } finally {
        setVoting(false)
      }
    },
    [agent, statement, conversationId, voting],
  )

  const onVote = useCallback(
    (value: -1 | 0 | 1) => {
      void handleVote(value)
    },
    [handleVote],
  )

  const openAssembly = useCallback(() => {
    void Linking.openURL(
      `https://assembly.blacksky.community/${conversationId}`,
    )
  }, [conversationId])

  if (notFound) {
    return (
      <View
        style={[
          styles.card,
          {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
        ]}>
        <Text style={[a.text_sm, {color: t.atoms.text_contrast_medium.color}]}>
          This conversation is no longer available.
        </Text>
      </View>
    )
  }

  if (error && !data) {
    return (
      <View
        style={[
          styles.card,
          {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
        ]}>
        <Text style={[a.text_sm, {color: t.atoms.text_contrast_medium.color}]}>
          {error}
        </Text>
      </View>
    )
  }

  if (!data) {
    return (
      <View
        style={[
          styles.card,
          {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
        ]}>
        <View style={styles.logoContainer}>
          <BlackskyLogo width={20} fill={t.atoms.text.color} />
          <Text style={{fontSize: 11, fontWeight: '600', color: '#8B8BFF'}}>
            People's Assembly
          </Text>
        </View>
        <Text
          style={[
            a.text_sm,
            {color: t.atoms.text_contrast_medium.color, marginTop: 8},
          ]}>
          Loading...
        </Text>
      </View>
    )
  }

  if (!data.conversation.is_active) {
    return (
      <View
        style={[
          styles.card,
          {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
        ]}>
        <AssemblyHeader
          topic={data.conversation.topic}
          description={data.conversation.description}
        />
        <Text
          style={[
            a.text_sm,
            {color: t.atoms.text_contrast_medium.color, marginTop: 8},
          ]}>
          This conversation is closed.
        </Text>
        <AssemblyFooter onPress={openAssembly} />
      </View>
    )
  }

  if (data.conversation.auth_needed_to_vote && !isAuthenticated) {
    return (
      <View
        style={[
          styles.card,
          {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
        ]}>
        <AssemblyHeader
          topic={data.conversation.topic}
          description={data.conversation.description}
        />
        <Pressable
          style={styles.signInButton}
          onPress={openAssembly}
          accessibilityRole="link"
          accessibilityLabel="Sign in to vote"
          accessibilityHint="Opens the assembly page to sign in and vote">
          <Text style={[a.text_sm, a.font_semi_bold, {color: '#fff'}]}>
            Sign in to vote
          </Text>
        </Pressable>
        <AssemblyFooter onPress={openAssembly} />
      </View>
    )
  }

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: t.atoms.bg_contrast_25.backgroundColor},
      ]}>
      <AssemblyHeader
        topic={data.conversation.topic}
        description={data.conversation.description}
      />

      {allVoted ? (
        <View style={{marginTop: 12}}>
          <Text
            style={[a.text_sm, {color: t.atoms.text_contrast_medium.color}]}>
            You've voted on all statements.
          </Text>
        </View>
      ) : statement ? (
        <>
          <View style={styles.statementCardStack}>
            <View style={styles.statementCard}>
              <View style={styles.statementAuthorRow}>
                {statement.author_avatar ? (
                  <Image
                    source={{uri: statement.author_avatar}}
                    style={styles.authorAvatar}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View
                    style={[styles.authorAvatar, {backgroundColor: '#ddd'}]}
                  />
                )}
                <View style={{flex: 1}}>
                  <Text style={[a.text_xs, {color: '#666'}]}>
                    {statement.author_name || 'Anonymous'} wrote:
                  </Text>
                  {(statement.author_is_team ||
                    statement.author_is_blacksky_member ||
                    statement.author_is_funder ||
                    statement.author_is_oss_supporter) && (
                    <View style={styles.badgeRow}>
                      {statement.author_is_team && (
                        <View style={[styles.badge, {backgroundColor: '#000'}]}>
                          <Text style={[styles.badgeText, {color: '#fff'}]}>
                            Admin
                          </Text>
                        </View>
                      )}
                      {statement.author_is_blacksky_member && (
                        <View
                          style={[styles.badge, {backgroundColor: '#8B8BFF'}]}>
                          <Text style={[styles.badgeText, {color: '#fff'}]}>
                            Member
                          </Text>
                        </View>
                      )}
                      {statement.author_is_funder && (
                        <View
                          style={[styles.badge, {backgroundColor: '#D2FC51'}]}>
                          <Text style={[styles.badgeText, {color: '#000'}]}>
                            Funder
                          </Text>
                        </View>
                      )}
                      {statement.author_is_oss_supporter && (
                        <View
                          style={[styles.badge, {backgroundColor: '#FF6B35'}]}>
                          <Text style={[styles.badgeText, {color: '#fff'}]}>
                            OSS
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
              <Text
                style={[
                  a.text_md,
                  a.font_bold,
                  {lineHeight: 22, color: '#000'},
                ]}>
                {statement.txt}
              </Text>
              {statement.remaining != null && statement.remaining > 0 && (
                <Text
                  style={[
                    a.text_xs,
                    {
                      color: '#999',
                      marginTop: 6,
                      textAlign: 'right',
                    },
                  ]}>
                  {statement.remaining > 100 ? '100+' : statement.remaining}{' '}
                  remaining
                </Text>
              )}
            </View>
            {(statement.remaining ?? 0) > 1 && (
              <View style={styles.stackLayer1} />
            )}
            {(statement.remaining ?? 0) > 2 && (
              <View style={styles.stackLayer2} />
            )}
          </View>

          <View style={styles.voteButtons}>
            <Pressable
              style={({hovered}: {hovered?: boolean}) => [
                styles.voteButton,
                {
                  borderColor: '#61C554',
                  backgroundColor: hovered
                    ? 'rgba(97, 197, 84, 0.15)'
                    : t.atoms.bg_contrast_25.backgroundColor,
                },
              ]}
              onPress={() => onVote(-1)}
              disabled={voting}
              accessibilityRole="button"
              accessibilityLabel="Agree"
              accessibilityHint="Vote agree on this statement">
              <Text style={[a.text_sm, a.font_semi_bold, {color: '#61C554'}]}>
                {voting ? '...' : 'Agree'}
              </Text>
            </Pressable>
            <Pressable
              style={({hovered}: {hovered?: boolean}) => [
                styles.voteButton,
                {
                  borderColor: '#F40B42',
                  backgroundColor: hovered
                    ? 'rgba(244, 11, 66, 0.12)'
                    : t.atoms.bg_contrast_25.backgroundColor,
                },
              ]}
              onPress={() => onVote(1)}
              disabled={voting}
              accessibilityRole="button"
              accessibilityLabel="Disagree"
              accessibilityHint="Vote disagree on this statement">
              <Text style={[a.text_sm, a.font_semi_bold, {color: '#F40B42'}]}>
                {voting ? '...' : 'Disagree'}
              </Text>
            </Pressable>
            <Pressable
              style={({hovered}: {hovered?: boolean}) => [
                styles.voteButton,
                {
                  borderColor: t.atoms.border_contrast_low.borderColor,
                  backgroundColor: hovered
                    ? t.atoms.bg_contrast_50.backgroundColor
                    : t.atoms.bg_contrast_25.backgroundColor,
                },
              ]}
              onPress={() => onVote(0)}
              disabled={voting}
              accessibilityRole="button"
              accessibilityLabel="Pass"
              accessibilityHint="Pass on this statement">
              <Text
                style={[
                  a.text_sm,
                  a.font_semi_bold,
                  {color: t.atoms.text_contrast_medium.color},
                ]}>
                {voting ? '...' : 'Pass / Unsure'}
              </Text>
            </Pressable>
          </View>

          {error ? (
            <Text style={[a.text_xs, {color: '#F40B42', marginTop: 6}]}>
              {error}
            </Text>
          ) : null}
        </>
      ) : null}

      <AssemblyFooter onPress={openAssembly} />
    </View>
  )
}

function AssemblyHeader({
  topic,
  description,
}: {
  topic: string
  description?: string
}) {
  const t = useTheme()
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <BlackskyLogo width={20} fill={t.atoms.text.color} />
        <Text
          style={{fontSize: 11, fontWeight: '600', color: t.atoms.text.color}}>
          People's Assembly
        </Text>
      </View>
      <Text
        style={[{fontSize: 15, fontWeight: '700', marginTop: 6}]}
        numberOfLines={2}>
        {topic}
      </Text>
      {description ? (
        <Text
          style={[
            a.text_xs,
            {color: t.atoms.text_contrast_medium.color, marginTop: 4},
          ]}
          numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </View>
  )
}

function AssemblyFooter({onPress}: {onPress: () => void}) {
  return (
    <View style={styles.footer}>
      <Pressable
        onPress={onPress}
        accessibilityRole="link"
        accessibilityLabel="Submit a statement"
        accessibilityHint="Opens the assembly conversation page">
        <Text style={{fontSize: 12, color: '#8B8BFF'}}>
          Submit a statement →
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  header: {
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statementCardStack: {
    marginTop: 8,
    marginBottom: 6,
  },
  statementCard: {
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: 'lightgray',
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 3,
  },
  stackLayer1: {
    height: 16,
    marginTop: -12,
    marginHorizontal: '0.5%',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: 'lightgray',
    borderRadius: 5,
    backgroundColor: '#fff',
    zIndex: 2,
  },
  stackLayer2: {
    height: 16,
    marginTop: -12,
    marginHorizontal: '1%',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#eee',
    borderRadius: 5,
    backgroundColor: '#fafafa',
    zIndex: 1,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  voteButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  statementAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: '#8B8BFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  footer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
})
