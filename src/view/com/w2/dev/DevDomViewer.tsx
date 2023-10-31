import React, {useEffect, useState} from 'react'
import {ViewStyle, StyleSheet, StyleProp, View, ScrollView} from 'react-native'
import {Text} from '../../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {s} from 'lib/styles'
import {TouchableOpacity} from 'react-native-gesture-handler'

interface DomViewerProps {
  style?: StyleProp<ViewStyle>
  dom?: Document
}

export const DomViewer = ({style, dom}: DomViewerProps) => {
  const pal = usePalette('default')

  const [xml, setXml] = useState<string | undefined>()
  const [formattedXml, setFormattedXml] = useState<string | undefined>()

  useEffect(() => {
    setXml(dom?.toString())
  }, [dom])
  useEffect(() => {
    setFormattedXml(formatXml(xml))
  }, [xml])

  const dumpDom = () => {
    console.log(xml)
  }

  return (
    <View style={[style, s.w100pct, pal.view]}>
      <ScrollView style={[s.flex1, s.w100pct, s.pl5, s.pr5]}>
        <Text type="mono" style={pal.text}>
          {formattedXml}
        </Text>
      </ScrollView>
      <View style={[styles.buttonBar, s.w100pct]}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.button, pal.viewInverted]}
          onPress={dumpDom}>
          <Text type="sm-bold" style={[pal.textInverted]}>
            Dump DOM to console
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const formatXml = (xml?: string) => {
  if (xml === undefined) return undefined
  let formatted = '',
    indent = ''
  const tab = '  '
  xml.split(/>\s*</).forEach(function (node) {
    if (node.match(/^\/\w/)) indent = indent.substring(tab.length)
    formatted += indent + '<' + node + '>\r\n'
    if (node.match(/^<?\w[^>]*[^/]$/)) indent += tab
  })
  return formatted.substring(1, formatted.length - 3)
}

const styles = StyleSheet.create({
  buttonBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    margin: 8,
    height: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
