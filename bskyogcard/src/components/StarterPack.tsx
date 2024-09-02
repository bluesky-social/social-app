/* eslint-disable bsky-internal/avoid-unwrapped-text */
import React from 'react'
import {AppBskyGraphDefs, AppBskyGraphStarterpack} from '@atproto/api'

import {Butterfly} from './Butterfly.js'
import {Img} from './Img.js'

export const STARTERPACK_HEIGHT = 630
export const STARTERPACK_WIDTH = 1200
export const TILE_SIZE = STARTERPACK_HEIGHT / 3

const GRADIENT_TOP = '#0A7AFF'
const GRADIENT_BOTTOM = '#59B9FF'
const IMAGE_STROKE = '#359CFF'

export function StarterPack(props: {
  starterPack: AppBskyGraphDefs.StarterPackView
  images: Map<string, Buffer>
}) {
  const {starterPack, images} = props
  const record = AppBskyGraphStarterpack.isRecord(starterPack.record)
    ? starterPack.record
    : null
  const imagesArray = [...images.values()]
  const imageOfCreator = images.get(starterPack.creator.did)
  const imagesExceptCreator = [...images.entries()]
    .filter(([did]) => did !== starterPack.creator.did)
    .map(([, image]) => image)
  const imagesAcross: Buffer[] = []
  if (imageOfCreator) {
    if (imagesExceptCreator.length >= 6) {
      imagesAcross.push(...imagesExceptCreator.slice(0, 3))
      imagesAcross.push(imageOfCreator)
      imagesAcross.push(...imagesExceptCreator.slice(3, 6))
    } else {
      const firstHalf = Math.floor(imagesExceptCreator.length / 2)
      imagesAcross.push(...imagesExceptCreator.slice(0, firstHalf))
      imagesAcross.push(imageOfCreator)
      imagesAcross.push(
        ...imagesExceptCreator.slice(firstHalf, imagesExceptCreator.length),
      )
    }
  } else {
    imagesAcross.push(...imagesExceptCreator.slice(0, 7))
  }
  const isLongTitle = record ? record.name.length > 30 : false
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: STARTERPACK_WIDTH,
        height: STARTERPACK_HEIGHT,
        backgroundColor: 'black',
        color: 'white',
        fontFamily: 'Inter',
      }}>
      {/* image tiles */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          width: TILE_SIZE * 6,
          height: TILE_SIZE * 3,
        }}>
        {[...Array(18)].map((_, i) => {
          const image = imagesArray.at(i % imagesArray.length)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                height: TILE_SIZE,
                width: TILE_SIZE,
              }}>
              {image && <Img height="100%" width="100%" src={image} />}
            </div>
          )
        })}
        {/* background overlay */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            position: 'absolute',
            backgroundImage: `linear-gradient(to bottom, ${GRADIENT_TOP}, ${GRADIENT_BOTTOM})`,
            opacity: 0.9,
          }}
        />
      </div>
      {/* foreground text & images */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          position: 'absolute',
          color: 'white',
        }}>
        <div
          style={{
            color: 'white',
            padding: 60,
            fontSize: 40,
          }}>
          JOIN THE CONVERSATION
        </div>
        <div style={{display: 'flex'}}>
          {imagesAcross.map((image, i) => {
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  height: 172 + 15 * 2,
                  width: 172 + 15 * 2,
                  margin: -15,
                  border: `15px solid ${IMAGE_STROKE}`,
                  borderRadius: '50%',
                  overflow: 'hidden',
                }}>
                <Img height="100%" width="100%" src={image} />
              </div>
            )
          })}
        </div>
        <div
          style={{
            padding: '75px 30px 0px',
            fontSize: isLongTitle ? 55 : 65,
            display: 'flex',
            textAlign: 'center',
          }}>
          {record?.name || 'Starter Pack'}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            justifyContent: 'center',
            padding: '30px 30px 10px',
          }}>
          on <Butterfly width="65" style={{margin: '-7px 10px 0'}} /> Bluesky
        </div>
      </div>
    </div>
  )
}
