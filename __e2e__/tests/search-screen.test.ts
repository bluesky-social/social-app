/* eslint-env detox/detox */

import {openApp, login, createServer} from '../util'

describe('Search screen', () => {
  let service: string
  beforeAll(async () => {
    service = await createServer('?users')
    await openApp({
      permissions: {notifications: 'YES', medialibrary: 'YES', photos: 'YES'},
    })
  })

  it('Login', async () => {
    await login(service, 'alice', 'hunter2')
  })

  it('Navigate to another user profile via autocomplete', async () => {
    await element(by.id('bottomBarSearchBtn')).tap()
    await element(by.id('searchTextInput')).typeText('bob')
    await element(by.id('searchAutoCompleteResult-bob.test')).tap()
    await expect(element(by.id('profileView'))).toBeVisible()
  })
})
