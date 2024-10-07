import {describe, expect, it} from '@jest/globals'
import tldts from 'tldts'

import {isEmailMaybeInvalid} from '#/lib/strings/email'

describe('emailTypoChecker', () => {
  const invalidCases = [
    'gnail.com',
    'gnail.co',
    'gmaill.com',
    'gmaill.co',
    'gmai.com',
    'gmai.co',
    'gmal.com',
    'gmal.co',
    'gmail.co',
    'iclod.com',
    'iclod.co',
    'outllok.com',
    'outllok.co',
    'outlook.co',
    'yaoo.com',
    'yaoo.co',
    'yaho.com',
    'yaho.co',
    'yahooo.com',
    'yahooo.co',
    'yahoo.co',
    'hithere.jul',
    'agpowj.notshop',
    'thisisnot.avalid.tld.nope',
    // old tld for czechoslovakia
    'czechoslovakia.cs',
    // tlds that cbs was registering in 2024 but cancelled
    'liveon.cbs',
    'its.showtime',
  ]
  const validCases = [
    'gmail.com',
    // subdomains (tests end of string)
    'gnail.com.test.com',
    'outlook.com',
    'yahoo.com',
    'icloud.com',
    'firefox.com',
    'firefox.co',
    'hello.world.com',
    'buy.me.a.coffee.shop',
    'mayotte.yt',
    'aland.ax',
    'bouvet.bv',
    'uk.gb',
    'chad.td',
    'somalia.so',
    'plane.aero',
    'cute.cat',
    'together.coop',
    'findme.jobs',
    'nightatthe.museum',
    'industrial.mil',
    'czechrepublic.cz',
    'lovakia.sk',
    // new gtlds in 2024
    'whatsinyour.locker',
    'letsmakea.deal',
    'skeet.now',
    'everyone.みんな',
    'bourgeois.lifestyle',
    'california.living',
    'skeet.ing',
    'listeningto.music',
    'createa.meme',
  ]

  it.each(invalidCases)(`should be invalid: abcde@%s`, domain => {
    expect(isEmailMaybeInvalid(`abcde@${domain}`, tldts)).toEqual(true)
  })

  it.each(validCases)(`should be valid: abcde@%s`, domain => {
    expect(isEmailMaybeInvalid(`abcde@${domain}`, tldts)).toEqual(false)
  })
})
