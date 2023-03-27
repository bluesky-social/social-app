/* eslint-env detox/detox */

const {openApp, login} = require('../util')

describe('Login', () => {
  beforeEach(async () => {
    await openApp({permissions: {notifications: 'YES'}})
  })

  it('As Alice, I can login', async () => {
    await expect(element(by.id('signInButton'))).toBeVisible()
    await login('alice', 'hunter2', {
      takeScreenshots: true,
    })
    await device.takeScreenshot('5- opened home screen')
  })
})
