import {Haptics} from 'lib/haptics'
import {makeAutoObservable} from 'mobx'
import {SelectionGeometry, WordRange} from 'view/com/w2/web-reader/Types'
import {
  WebReaderViewInterface,
  getJS,
} from 'view/com/w2/web-reader/WebReaderViewInterface'

const ID_PREFIX = `highlight_`
let idIndex = 0

export class SelectableBlockModel {
  id: string
  highlighted: boolean = false
  geometry: SelectionGeometry | undefined = undefined

  constructor(
    public wordRange: WordRange,
    public sentence: string[],
    public webReader: WebReaderViewInterface,
  ) {
    this.id = ID_PREFIX + idIndex++
    makeAutoObservable(this, {webReader: false}, {autoBind: true})
  }

  highlight() {
    this.geometry && this.webReader.onHighlightBlock(this.id, this.geometry)
  }

  unhighlight() {
    this.webReader.onUnhighlightBlock(this.id)
  }

  delete() {
    this.webReader.onDeleteBlock(this.id)
  }

  _getExtractBoundingBoxJs() {
    return getJS('onExtractBoundingBox', this.id, this.wordRange)
  }

  isInside(pos: {x: number; y: number}) {
    if (!this.geometry) return
    const {firstLine, middle, lastLine} = this.geometry
    return (
      contains(firstLine, pos) ||
      (middle && contains(middle, pos)) ||
      (lastLine && contains(lastLine, pos))
    )
  }
}

type BlockMap = {[id: string]: SelectableBlockModel}

export class SelectedBlocksModel {
  blockMap: BlockMap = {}
  blocks: SelectableBlockModel[] = []
  selectedBlock?: SelectableBlockModel = undefined

  constructor(
    public webReader: WebReaderViewInterface,
    public onSelectionChanged: (
      selBlock: SelectableBlockModel | undefined,
    ) => void,
  ) {
    makeAutoObservable(
      this,
      {blockMap: false, webReader: false},
      {autoBind: true},
    )
  }

  deleteAllBlocks() {
    for (const block of this.blocks) block.delete()
    this.blockMap = {}
    this.blocks = []
  }

  setSentences(sentences: string[][]) {
    this.deleteAllBlocks()
    let numWords = 0
    for (const sentence of sentences) {
      const toWord = numWords + sentence.length
      if (sentence.join('').trim() !== '') {
        const block = new SelectableBlockModel(
          {fromWord: numWords, toWord},
          sentence,
          this.webReader,
        )
        this.blocks.push(block)
        this.blockMap[block.id] = block
      }
      numWords = toWord
    }
  }

  setGeometry(id: string, geometry: SelectionGeometry) {
    const block = this.blockMap[id]
    if (!block) throw new Error(`SelectableBlock id not found: ${id}`)
    block.geometry = geometry
  }

  extractBoundingBoxes() {
    let js = ''
    for (const block of this.blocks) js += block._getExtractBoundingBoxJs()
    this.webReader.call(js)
  }

  unhighlightAll() {
    this.selectedBlock && this.selectedBlock.unhighlight()
    this.selectedBlock = undefined
  }

  highlightAtPos(
    viewTop: number,
    _height: number,
    screenPos: {x: number; y: number},
  ) {
    // TODO: If dragging the pointer becomes too slow we could use a caching
    // structure indexed on `viewTop` and `height`. This could track which
    // blocks are visible on screen and only iterate through these.

    const pos = {x: screenPos.x, y: screenPos.y - viewTop}
    let notifySelectionChanged = false

    if (this.selectedBlock) {
      if (this.selectedBlock.isInside(pos)) {
        return
      }
      this.selectedBlock.unhighlight()
      this.selectedBlock = undefined
      notifySelectionChanged = true
    }

    for (const block of this.blocks) {
      if (block.isInside(pos)) {
        Haptics.default()
        block.highlight()
        this.selectedBlock = block
        notifySelectionChanged = true
        break
      }
    }

    if (notifySelectionChanged) {
      this.onSelectionChanged(this.selectedBlock)
    }
  }
}

const contains = (
  {left, right, top, bottom}: DOMRectReadOnly,
  {x, y}: {x: number; y: number},
) => x >= left && x < right && y >= top && y < bottom
