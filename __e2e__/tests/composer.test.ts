/* eslint-env detox/detox */

import {openApp, login, createServer} from '../util'

describe('Composer', () => {
  let service: string
  beforeAll(async () => {
    service = await createServer('?users')
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('As Alice, I can login, and post a text', async () => {
    await login(service, 'alice', 'hunter2')
    await element(by.id('composeFAB')).tap()
    await device.takeScreenshot('1- opened composer')
    await element(by.id('composerTextInput')).typeText(
      'Greetings earthlings, I come in peace... and to run some tests.',
    )
    await device.takeScreenshot('2- entered text')
    await element(by.id('composerPublishButton')).tap()
    await device.takeScreenshot('3- opened general section')
    await expect(element(by.id('composeFAB'))).toBeVisible()
  })
})
