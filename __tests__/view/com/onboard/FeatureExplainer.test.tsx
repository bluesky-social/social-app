import React from 'react'
import {cleanup, fireEvent, render} from '../../../../jest/test-utils'
import {FeatureExplainer} from '../../../../src/view/com/onboard/FeatureExplainer'
import {mockedOnboardStore} from '../../../../__mocks__/state-mock'

describe('FeatureExplainer', () => {
  afterAll(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders and clicks skip button', async () => {
    const {findByTestId} = render(<FeatureExplainer />)

    const featureExplainerSkipButton = await findByTestId(
      'featureExplainerSkipButton',
    )
    expect(featureExplainerSkipButton).toBeTruthy()

    fireEvent.press(featureExplainerSkipButton)
    expect(mockedOnboardStore.next).toHaveBeenCalled()
  })

  it('renders and clicks next button', async () => {
    const {findByTestId} = render(<FeatureExplainer />)

    const featureExplainerNextButton = await findByTestId(
      'featureExplainerNextButton',
    )
    expect(featureExplainerNextButton).toBeTruthy()

    fireEvent.press(featureExplainerNextButton)
    fireEvent.press(featureExplainerNextButton)

    expect(mockedOnboardStore.next).toHaveBeenCalled()
  })

  // react-native-tab-view's TabView component had to be mocked because of runtime error in jest environment
  // This prevents further coverage to be reached on this component

  it('matches snapshot', () => {
    const page = render(<FeatureExplainer />)
    expect(page).toMatchSnapshot()
  })
})
