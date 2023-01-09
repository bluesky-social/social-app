import React from 'react'
import {fireEvent, render, waitFor} from '../../../../jest/test-utils'
import {ConfirmModal} from '../../../../src/state/models/shell-ui'
import {InviteAccepter} from '../../../../src/view/com/notifications/InviteAccepter'
import {
  mockedMembershipsModel,
  mockedMeStore,
  mockedNotificationsViewItemModel,
  mockedRootStore,
  mockedShellStore,
} from '../../../../__mocks__/state-mock'
import * as apilib from '../../../../src/state/lib/api'
import * as Toast from '../../../../src/view/com/util/Toast'

describe('InviteAccepter', () => {
  const mockedProps = {
    item: mockedNotificationsViewItemModel,
  }
  afterAll(() => {
    jest.clearAllMocks()
  })

  it('presses accept invite button', async () => {
    const openModalMock = jest
      .fn()
      .mockImplementation((item: ConfirmModal) => item.onPressConfirm())
    const spyOnToast = jest.spyOn(Toast, 'show')
    const spyOnAcceptSceneInvite = jest
      .spyOn(apilib, 'acceptSceneInvite')
      .mockResolvedValue('test ok')
    const {findByTestId} = render(<InviteAccepter {...mockedProps} />, {
      ...mockedRootStore,
      shell: {
        ...mockedShellStore,
        openModal: openModalMock,
      },
    })

    const acceptInviteButton = await findByTestId('acceptInviteButton')
    expect(acceptInviteButton).toBeTruthy()
    fireEvent.press(acceptInviteButton)

    expect(openModalMock).toHaveBeenCalled()
    expect(spyOnAcceptSceneInvite).toHaveBeenCalled()

    await waitFor(() => {
      expect(mockedMeStore.refreshMemberships).toHaveBeenCalled()
      expect(spyOnToast).toHaveBeenCalled()
    })
  })

  it('renders invite accepted message when already member', async () => {
    jest.spyOn(React, 'useState').mockReturnValue(['123', jest.fn()])
    const {findByTestId} = render(<InviteAccepter {...mockedProps} />, {
      ...mockedRootStore,
      me: {
        ...mockedMeStore,
        memberships: {
          ...mockedMembershipsModel,
          isMemberOf: jest.fn().mockReturnValue(true),
        },
      },
    })
    const inviteAccepted = await findByTestId('inviteAccepted')
    expect(inviteAccepted).toBeTruthy()
  })

  it('matches snapshot', () => {
    const page = render(<InviteAccepter {...mockedProps} />)
    expect(page).toMatchSnapshot()
  })
})
