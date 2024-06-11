import React from 'react'

import {Butterfly} from './Butterfly.js'

export function StarterPack(props: {
  images: Buffer[]
  height: number
  width: number
}) {
  const {images, height, width} = props
  const tileSize = height / 3
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: width,
        height: height,
        backgroundColor: 'black',
        color: 'white',
        fontFamily: 'Inter',
      }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          width: tileSize * 5,
          height: tileSize * 3,
        }}>
        {[...Array(15)].map((_, i) => {
          const image = images.at(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                height: tileSize,
                width: tileSize,
              }}>
              {image && (
                <img
                  height="100%"
                  width="100%"
                  src={`data:image/jpeg;base64,${image.toString('base64')}`}
                />
              )}
            </div>
          )
        })}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: Math.ceil(tileSize * Math.SQRT2),
            height: Math.ceil(tileSize * Math.SQRT2),
            borderRadius: '50%',
            backgroundImage:
              'linear-gradient(to bottom right, #3D83F6, #5999FF)',
          }}>
          <Butterfly style={{color: 'white'}} width={175} />
        </div>
      </div>
    </div>
  )
}
