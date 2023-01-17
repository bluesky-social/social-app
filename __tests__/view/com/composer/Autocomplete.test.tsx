import React from 'react'
import {Autocomplete} from '../../../../src/view/com/composer/Autocomplete'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'

describe('Autocomplete', () => {
  const onSelectMock = jest.fn()
  const mockedProps = {
    active: true,
    items: [
      {
        handle: 'handle.test',
        displayName: 'Test Display',
      },
      {
        handle: 'handle2.test',
        displayName: 'Test Display 2',
      },
    ],
    onSelect: onSelectMock,
  }

  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders a button for each user', async () => {
    const {findAllByTestId} = render(<Autocomplete {...mockedProps} />)
    const autocompleteButton = await findAllByTestId('autocompleteButton')
    expect(autocompleteButton.length).toBe(2)
  })

  it('triggers onSelect by pressing the button', async () => {
    const {findAllByTestId} = render(<Autocomplete {...mockedProps} />)
    const autocompleteButton = await findAllByTestId('autocompleteButton')

    fireEvent.press(autocompleteButton[0])
    expect(onSelectMock).toHaveBeenCalledWith('handle.test')

    fireEvent.press(autocompleteButton[1])
    expect(onSelectMock).toHaveBeenCalledWith('handle2.test')
  })
})
