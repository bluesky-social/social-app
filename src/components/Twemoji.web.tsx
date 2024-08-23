import React from 'react'
import twemoji from '@discordapp/twemoji'
import Graphemer from 'graphemer'

// Thanks to https://gist.github.com/chibicode/fe195d792270910226c928b69a468206?permalink_comment_id=4241184#gistcomment-4241184
// for figuring this out
const U200D = String.fromCharCode(0x200d)
const UFE0Fg = /\uFE0F/g

let Twemoji = ({children}: {children: string}): React.ReactNode => {
  if (!/\p{Extended_Pictographic}/u.test(children)) {
    return children
  }

  const splitter = new Graphemer()
  const graphemes = splitter.iterateGraphemes(children)
  let result: React.ReactNode[] = []
  let i = 0
  for (const grapheme of graphemes) {
    if (/\p{Extended_Pictographic}/u.test(grapheme)) {
      const HexCodePoint = twemoji.convert.toCodePoint(
        grapheme.indexOf(U200D) < 0 ? grapheme.replace(UFE0Fg, '') : grapheme,
      )
      result.push(
        <img
          key={i++}
          src={`https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/72x72/${HexCodePoint}.png`}
          alt={grapheme}
          className="twemoji"
        />,
      )
    } else {
      result.push(grapheme)
    }
  }
  return result
}

Twemoji = React.memo(Twemoji)
export {Twemoji}
