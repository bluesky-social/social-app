import React from 'react'
import App from '../src/App.native'
import renderer from 'react-test-renderer'

it('App renders correctly', () => {
  renderer.act(() => {
    const tree = renderer.create(<App />)
    expect(tree).toMatchSnapshot()
  })
})
