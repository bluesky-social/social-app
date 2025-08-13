// @flow

// https://github.com/FormidableLabs/react-native-svg-mock
import React from 'react'

const createComponent = function (name) {
  return class extends React.Component {
    // overwrite the displayName, since this is a class created dynamically
    static displayName = name

    render() {
      return React.createElement(name, this.props, this.props.children)
    }
  }
}

// Mock all react-native-svg exports
// from https://github.com/magicismight/react-native-svg/blob/master/index.js
const Svg = createComponent('Svg')
const Circle = createComponent('Circle')
const Ellipse = createComponent('Ellipse')
const G = createComponent('G')
const Text = createComponent('Text')
const TextPath = createComponent('TextPath')
const TSpan = createComponent('TSpan')
const Path = createComponent('Path')
const Polygon = createComponent('Polygon')
const Polyline = createComponent('Polyline')
const Line = createComponent('Line')
const Rect = createComponent('Rect')
const Use = createComponent('Use')
const Image = createComponent('Image')
const Symbol = createComponent('Symbol')
const Defs = createComponent('Defs')
const LinearGradient = createComponent('LinearGradient')
const RadialGradient = createComponent('RadialGradient')
const Stop = createComponent('Stop')
const ClipPath = createComponent('ClipPath')
const Pattern = createComponent('Pattern')
const Mask = createComponent('Mask')

export {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Image,
  Line,
  LinearGradient,
  Mask,
  Path,
  Pattern,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Symbol,
  Text,
  TextPath,
  TSpan,
  Use,
}

export default Svg
