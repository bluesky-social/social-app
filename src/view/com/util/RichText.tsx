import React from 'react'
import {Text, TextStyle, StyleProp} from 'react-native'
import {Link} from './Link'
import {s} from '../../lib/styles'

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
      els.push(
        <Text key={key} style={style}>
          {segment}
        </Text>,
      )
    } else {
      els.push(
        <Link
          key={key}
          title={segment.text}
          href={`/profile/${segment.entity.value}`}>
          <Text key={key} style={[style, s.blue3]}>
            {segment.text}
          </Text>
        </Link>,
      )
    }
    key++
  }
  return <>{els}</>
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
        stripUsername(subtext) !== stripUsername(currEnt.value)
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
