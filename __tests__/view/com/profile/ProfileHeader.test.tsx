import React from 'react'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {ProfileViewModel} from '../../../../src/state/models/profile-view'
import {ProfileHeader} from '../../../../src/view/com/profile/ProfileHeader'
import {
  mockedNavigationStore,
  mockedProfileStore,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'

describe('ProfileHeader', () => {
  const mockedProps = {
    view: mockedProfileStore,
    onRefreshAll: jest.fn(),
  }
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders ErrorMessage on error', async () => {
    const {findByTestId} = render(
      <ProfileHeader
        {...{
          view: {
            ...mockedProfileStore,
            hasError: true,
          } as ProfileViewModel,
          onRefreshAll: jest.fn(),
        }}
      />,
    )

    const profileHeaderHasError = await findByTestId('profileHeaderHasError')
    expect(profileHeaderHasError).toBeTruthy()
  })

  it('presses and opens edit profile', async () => {
    const {findByTestId} = render(<ProfileHeader {...mockedProps} />)

    const profileHeaderEditProfileButton = await findByTestId(
      'profileHeaderEditProfileButton',
    )
    expect(profileHeaderEditProfileButton).toBeTruthy()
    fireEvent.press(profileHeaderEditProfileButton)

    expect(mockedShellStore.openModal).toHaveBeenCalled()
  })

  it('presses and opens followers page', async () => {
    const {findByTestId} = render(<ProfileHeader {...mockedProps} />)

    const profileHeaderFollowersButton = await findByTestId(
      'profileHeaderFollowersButton',
    )
    expect(profileHeaderFollowersButton).toBeTruthy()
    fireEvent.press(profileHeaderFollowersButton)

    expect(mockedNavigationStore.navigate).toHaveBeenCalledWith(
      '/profile/testhandle/followers',
    )
  })

  it('presses and opens avatar modal', async () => {
    const {findByTestId} = render(<ProfileHeader {...mockedProps} />)

    const profileHeaderAviButton = await findByTestId('profileHeaderAviButton')
    expect(profileHeaderAviButton).toBeTruthy()
    fireEvent.press(profileHeaderAviButton)

    expect(mockedShellStore.openLightbox).toHaveBeenCalled()
  })

  it('presses and opens follows page', async () => {
    const {findByTestId} = render(<ProfileHeader {...mockedProps} />)

    const profileHeaderFollowsButton = await findByTestId(
      'profileHeaderFollowsButton',
    )
    expect(profileHeaderFollowsButton).toBeTruthy()
    fireEvent.press(profileHeaderFollowsButton)

    expect(mockedNavigationStore.navigate).toHaveBeenCalledWith(
      '/profile/testhandle/follows',
    )
  })

  it('toggles following', async () => {
    const {findByTestId} = render(
      <ProfileHeader
        {...{
          view: {
            ...mockedProfileStore,
            did: 'test did 2',
          } as ProfileViewModel,
          onRefreshAll: jest.fn(),
        }}
      />,
    )

    const profileHeaderToggleFollowButton = await findByTestId(
      'profileHeaderToggleFollowButton',
    )
    expect(profileHeaderToggleFollowButton).toBeTruthy()
    fireEvent.press(profileHeaderToggleFollowButton)

    expect(mockedProps.view.toggleFollowing).toHaveBeenCalled()
  })
})
