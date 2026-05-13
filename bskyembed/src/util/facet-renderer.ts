import * as facetDefs from '../lexicons/app/bsky/richtext/facet.defs'

type Facet = facetDefs.Main
type Link = facetDefs.Link
type Mention = facetDefs.Mention
type Tag = facetDefs.Tag

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export class FacetSegment {
  constructor(
    public text: string,
    public facet?: Facet,
  ) {}

  get link(): Link | undefined {
    return this.facet?.features.find(
      f => f.$type === 'app.bsky.richtext.facet#link',
    ) as Link | undefined
  }

  get mention(): Mention | undefined {
    return this.facet?.features.find(
      f => f.$type === 'app.bsky.richtext.facet#mention',
    ) as Mention | undefined
  }

  get tag(): Tag | undefined {
    return this.facet?.features.find(
      f => f.$type === 'app.bsky.richtext.facet#tag',
    ) as Tag | undefined
  }
}

export class FacetRenderer {
  private utf8: Uint8Array
  private facets: Facet[]

  constructor({text, facets}: {text: string; facets?: Facet[]}) {
    this.utf8 = encoder.encode(text)
    this.facets = (facets ?? [])
      .filter(f => f.index.byteStart <= f.index.byteEnd)
      .sort((a, b) => a.index.byteStart - b.index.byteStart)
  }

  private slice(start: number, end: number): string {
    return decoder.decode(this.utf8.slice(start, end))
  }

  *segments(): Generator<FacetSegment, void, void> {
    if (!this.facets.length) {
      yield new FacetSegment(decoder.decode(this.utf8))
      return
    }

    let textCursor = 0
    let facetCursor = 0
    do {
      const currFacet = this.facets[facetCursor]
      if (textCursor < currFacet.index.byteStart) {
        yield new FacetSegment(
          this.slice(textCursor, currFacet.index.byteStart),
        )
      } else if (textCursor > currFacet.index.byteStart) {
        facetCursor++
        continue
      }
      if (currFacet.index.byteStart < currFacet.index.byteEnd) {
        const subtext = this.slice(
          currFacet.index.byteStart,
          currFacet.index.byteEnd,
        )
        if (!subtext.trim()) {
          yield new FacetSegment(subtext)
        } else {
          yield new FacetSegment(subtext, currFacet)
        }
      }
      textCursor = currFacet.index.byteEnd
      facetCursor++
    } while (facetCursor < this.facets.length)
    if (textCursor < this.utf8.byteLength) {
      yield new FacetSegment(this.slice(textCursor, this.utf8.byteLength))
    }
  }
}
