/*
= Rich Text Manipulation

When we sanitize rich text, we have to update the entity indices as the
text is modified. This can be modeled as inserts() and deletes() of the
rich text string. The possible scenarios are outlined below, along with
their expected behaviors.

NOTE: Slices are start inclusive, end exclusive

== richTextInsert()

Target string:

   0 1 2 3 4 5 6 7 8 910   // string indices
   h e l l o   w o r l d   // string value
       ^-------^           // target slice {start: 2, end: 7}

Scenarios:

A: ^                       // insert "test" at 0
B:        ^                // insert "test" at 4
C:                 ^       // insert "test" at 8

A = before           -> move both by num added
B = inner            -> move end by num added
C = after            -> noop

Results:

A: 0 1 2 3 4 5 6 7 8 910   // string indices
   t e s t h e l l o   w   // string value
               ^-------^   // target slice {start: 6, end: 11}

B: 0 1 2 3 4 5 6 7 8 910   // string indices
   h e l l t e s t o   w   // string value
       ^---------------^   // target slice {start: 2, end: 11}

C: 0 1 2 3 4 5 6 7 8 910   // string indices
   h e l l o   w o t e s   // string value
       ^-------^           // target slice {start: 2, end: 7}

== richTextDelete()

Target string:

   0 1 2 3 4 5 6 7 8 910   // string indices
   h e l l o   w o r l d   // string value
       ^-------^           // target slice {start: 2, end: 7}

Scenarios:

A: ^---------------^       // remove slice {start: 0, end: 9}
B:               ^-----^   // remove slice {start: 7, end: 11}
C:         ^-----------^   // remove slice {start: 4, end: 11}
D:       ^-^               // remove slice {start: 3, end: 5}
E:   ^-----^               // remove slice {start: 1, end: 5}
F: ^-^                     // remove slice {start: 0, end: 2}

A = entirely outer   -> delete slice
B = entirely after   -> noop
C = partially after  -> move end to remove-start
D = entirely inner   -> move end by num removed
E = partially before -> move start to remove-start index, move end by num removed
F = entirely before  -> move both by num removed

Results:

A: 0 1 2 3 4 5 6 7 8 910   // string indices
   l d                     // string value
                           // target slice (deleted)

B: 0 1 2 3 4 5 6 7 8 910   // string indices
   h e l l o   w           // string value
       ^-------^           // target slice {start: 2, end: 7}

C: 0 1 2 3 4 5 6 7 8 910   // string indices
   h e l l                 // string value
       ^-^                 // target slice {start: 2, end: 4}

D: 0 1 2 3 4 5 6 7 8 910   // string indices
   h e l   w o r l d       // string value
       ^---^               // target slice {start: 2, end: 5}

E: 0 1 2 3 4 5 6 7 8 910   // string indices
   h   w o r l d           // string value
     ^-^                   // target slice {start: 1, end: 3}

F: 0 1 2 3 4 5 6 7 8 910   // string indices
   l l o   w o r l d       // string value
   ^-------^               // target slice {start: 0, end: 5}
 */

import cloneDeep from 'lodash.clonedeep'
import {AppBskyFeedPost} from '@atproto/api'
import {removeExcessNewlines} from './rich-text-sanitize'

export type Entity = AppBskyFeedPost.Entity
export interface RichTextOpts {
  cleanNewlines?: boolean
}

export class RichText {
  constructor(
    public text: string,
    public entities?: Entity[],
    opts?: RichTextOpts,
  ) {
    if (opts?.cleanNewlines) {
      removeExcessNewlines(this).copyInto(this)
    }
  }

  clone() {
    return new RichText(this.text, cloneDeep(this.entities))
  }

  copyInto(target: RichText) {
    target.text = this.text
    target.entities = cloneDeep(this.entities)
  }

  insert(insertIndex: number, insertText: string) {
    this.text =
      this.text.slice(0, insertIndex) +
      insertText +
      this.text.slice(insertIndex)

    if (!this.entities?.length) {
      return this
    }

    const numCharsAdded = insertText.length
    for (const ent of this.entities) {
      // see comment at top of file for labels of each scenario
      // scenario A (before)
      if (insertIndex <= ent.index.start) {
        // move both by num added
        ent.index.start += numCharsAdded
        ent.index.end += numCharsAdded
      }
      // scenario B (inner)
      else if (insertIndex >= ent.index.start && insertIndex < ent.index.end) {
        // move end by num added
        ent.index.end += numCharsAdded
      }
      // scenario C (after)
      // noop
    }
    return this
  }

  delete(removeStartIndex: number, removeEndIndex: number) {
    this.text =
      this.text.slice(0, removeStartIndex) + this.text.slice(removeEndIndex)

    if (!this.entities?.length) {
      return this
    }

    const numCharsRemoved = removeEndIndex - removeStartIndex
    for (const ent of this.entities) {
      // see comment at top of file for labels of each scenario
      // scenario A (entirely outer)
      if (
        removeStartIndex <= ent.index.start &&
        removeEndIndex >= ent.index.end
      ) {
        // delete slice (will get removed in final pass)
        ent.index.start = 0
        ent.index.end = 0
      }
      // scenario B (entirely after)
      else if (removeStartIndex > ent.index.end) {
        // noop
      }
      // scenario C (partially after)
      else if (
        removeStartIndex > ent.index.start &&
        removeStartIndex <= ent.index.end &&
        removeEndIndex > ent.index.end
      ) {
        // move end to remove start
        ent.index.end = removeStartIndex
      }
      // scenario D (entirely inner)
      else if (
        removeStartIndex >= ent.index.start &&
        removeEndIndex <= ent.index.end
      ) {
        // move end by num removed
        ent.index.end -= numCharsRemoved
      }
      // scenario E (partially before)
      else if (
        removeStartIndex < ent.index.start &&
        removeEndIndex >= ent.index.start &&
        removeEndIndex <= ent.index.end
      ) {
        // move start to remove-start index, move end by num removed
        ent.index.start = removeStartIndex
        ent.index.end -= numCharsRemoved
      }
      // scenario F (entirely before)
      else if (removeEndIndex < ent.index.start) {
        // move both by num removed
        ent.index.start -= numCharsRemoved
        ent.index.end -= numCharsRemoved
      }
    }

    // filter out any entities that were made irrelevant
    this.entities = this.entities.filter(ent => ent.index.start < ent.index.end)
    return this
  }
}
