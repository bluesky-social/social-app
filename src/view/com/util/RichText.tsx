import React from 'react'
import {Text, TextStyle, StyleProp} from 'react-native'
import {TextLink} from './Link'
import {s} from '../../lib/styles'
import {toShortUrl} from '../../../lib/strings'

type TextSlice = {start: number; end: number}
type Entity = {
  index: TextSlice
  type: string
  value: string
}

export function RichText({
  text,
  entities,
  style,
}: {
  text: string
  entities?: Entity[]
  style?: StyleProp<TextStyle>
}) {
  if (!entities?.length) {
    return <Text style={style}>{text}</Text>
  }
  if (!style) style = []
  else if (!Array.isArray(style)) style = [style]
  entities.sort(sortByIndex)
  const segments = Array.from(toSegments(text, entities))
  const els = []
  let key = 0
  for (const segment of segments) {
    if (typeof segment === 'string') {
      els.push(segment)
    } else {
      if (segment.entity.type === 'mention') {
        els.push(
          <TextLink
            key={key}
            text={segment.text}
            href={`/profile/${segment.entity.value}`}
            style={[style, s.blue3]}
          />,
        )
      } else if (segment.entity.type === 'link') {
        els.push(
          <TextLink
            key={key}
            text={toShortUrl(segment.text)}
            href={segment.entity.value}
            style={[style, s.blue3]}
          />,
        )
      }
    }
    key++
  }
  return <Text style={style}>{els}</Text>
}

function sortByIndex(a: Entity, b: Entity) {
  return a.index.start - b.index.start
}

function* toSegments(text: string, entities: Entity[]) {
  let cursor = 0
  let i = 0
  do {
    let currEnt = entities[i]
    if (cursor < currEnt.index.start) {
      yield text.slice(cursor, currEnt.index.start)
    } else if (cursor > currEnt.index.start) {
      i++
      continue
    }
    if (currEnt.index.start < currEnt.index.end) {
      let subtext = text.slice(currEnt.index.start, currEnt.index.end)
      if (
        !subtext.trim() ||
        (currEnt.type === 'mention' &&
          stripUsername(subtext) !== stripUsername(currEnt.value)) ||
        (currEnt.type === 'link' && !isSameLink(subtext, currEnt.value))
      ) {
        // dont yield links to empty strings or strings that don't match the entity value
        yield subtext
      } else {
        yield {
          entity: currEnt,
          text: subtext,
        }
      }
    }
    cursor = currEnt.index.end
    i++
  } while (i < entities.length)
  if (cursor < text.length) {
    yield text.slice(cursor, text.length)
  }
}

function stripUsername(v: string): string {
  return v.trim().replace('@', '')
}

function isSameLink(a: string, b: string) {
  a = a.startsWith('http') ? a : `https://${a}`
  b = b.startsWith('http') ? b : `https://${b}`
  return a === b
}
