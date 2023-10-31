import {
  extractMiniblogUriInfo,
  findMiniblogUriInText,
  makeMiniblogUri,
} from 'lib/waverly/miniblog-uris'

describe('miniblogUris', () => {
  it('creates a miniblog uri', () => {
    const uri = makeMiniblogUri('alice.waverly.social', '3k3y4djuhss2q')
    expect(uri).toBe(
      'https://waverly.social/profile/alice.waverly.social/w/3k3y4djuhss2q',
    )
  })

  it('extract valid miniblog uri', () => {
    let res = extractMiniblogUriInfo(
      'https://waverly.social/profile/alice.waverly.social/w/3k3y4djuhss2q',
    )
    expect(res?.handle).toBe('alice.waverly.social')
    expect(res?.rkey).toBe('3k3y4djuhss2q')
    res = extractMiniblogUriInfo(
      'https://waverly.social/profile/alice~wav_erly-social/w/_~.-',
    )
    expect(res?.handle).toBe('alice~wav_erly-social')
    expect(res?.rkey).toBe('_~.-')
    res = extractMiniblogUriInfo('https://waverly.social/profile/_/w/_')
    expect(res?.handle).toBe('_')
    expect(res?.rkey).toBe('_')
  })

  it('returns undefined on invalid miniblog uri', () => {
    let res = extractMiniblogUriInfo('not_a_url')
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo('https://waverly.social/profile/')
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'https://waverly.social/x/alice.waverly.social/3k3y4djuhss2q',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'https://waverly.social/profile/alice.waverly.social',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'https://waverly.social/profile/alice.waverly.social/w/',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'https://waverly.social/profile//w/3k3y4djuhss2q',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'https://waverly.social/profile/alice.waverly.social/w/3k3y4djuhss2q/extra',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'http://waverly.social/profile/alice.waverly.social/w/3k3y4djuhss2q',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'https://waverly.social/profile/alice. .social/w/3k3y4djuhss2q',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(
      'https://waverly.social/profile/alice.waverly.social/w/3 q',
    )
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo(undefined)
    expect(res).toBeUndefined()
    res = extractMiniblogUriInfo('')
    expect(res).toBeUndefined()
  })

  it('finds a miniblog uri', () => {
    let res = findMiniblogUriInText('https://waverly.social/profile/a/w/b')
    expect(res?.handle).toBe('a')
    expect(res?.rkey).toBe('b')
    res = findMiniblogUriInText(
      'Prefix... https://waverly.social/profile/a/w/b',
    )
    expect(res?.handle).toBe('a')
    expect(res?.rkey).toBe('b')
    res = findMiniblogUriInText('Prefix...https://waverly.social/profile/a/w/b')
    expect(res?.handle).toBe('a')
    expect(res?.rkey).toBe('b')
    res = findMiniblogUriInText(
      'https://waverly.social/profile/a/w/b ...Suffix',
    )
    expect(res?.handle).toBe('a')
    expect(res?.rkey).toBe('b')
    res = findMiniblogUriInText(
      'prefix-https://waverly.social/profile/a/w/b suffix',
    )
    expect(res?.handle).toBe('a')
    expect(res?.rkey).toBe('b')
    res = findMiniblogUriInText(' https://waverly.social/profile/-/w/- ')
    expect(res?.handle).toBe('-')
    expect(res?.rkey).toBe('-')
  })

  it('does not finds a missing miniblog uri', () => {
    let res = findMiniblogUriInText('This is some random string')
    expect(res).toBeUndefined()
    res = findMiniblogUriInText('hhttps://waverly.social/profile/a/w/b')
    expect(res).toBeUndefined()
    res = findMiniblogUriInText('https://waverly.social/profile/a/w/b/c')
    expect(res).toBeUndefined()
    res = findMiniblogUriInText('https://waverly.social/profile/a/w/b@123')
    expect(res).toBeUndefined()
    res = findMiniblogUriInText('http://waverly.social/profile/a/w/b')
    expect(res).toBeUndefined()
    res = findMiniblogUriInText(undefined)
    expect(res).toBeUndefined()
    res = findMiniblogUriInText('')
    expect(res).toBeUndefined()
  })
})
