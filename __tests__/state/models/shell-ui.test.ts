import {
  ConfirmModal,
  ImagesLightbox,
  ShellUiModel,
} from './../../../src/state/models/shell-ui'

describe('ShellUiModel', () => {
  let model: ShellUiModel

  beforeEach(() => {
    model = new ShellUiModel()
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call the openModal & closeModal method', () => {
    const m = new ConfirmModal('Test Modal', 'Look good?', () => {})
    model.openModal(m)
    expect(model.isModalActive).toEqual(true)
    expect(model.activeModal).toEqual(m)

    model.closeModal()
    expect(model.isModalActive).toEqual(false)
    expect(model.activeModal).toBeUndefined()
  })

  it('should call the openLightbox & closeLightbox method', () => {
    const lt = new ImagesLightbox(['uri'], 0)
    model.openLightbox(lt)
    expect(model.isLightboxActive).toEqual(true)
    expect(model.activeLightbox).toEqual(lt)

    model.closeLightbox()
    expect(model.isLightboxActive).toEqual(false)
    expect(model.activeLightbox).toBeUndefined()
  })

  it('should call the openComposer & closeComposer method', () => {
    const composer = {
      replyTo: {
        uri: 'uri',
        cid: 'cid',
        text: 'text',
        author: {
          handle: 'handle',
          displayName: 'name',
        },
      },
      onPost: jest.fn(),
    }
    model.openComposer(composer)
    expect(model.isComposerActive).toEqual(true)
    expect(model.composerOpts).toEqual(composer)

    model.closeComposer()
    expect(model.isComposerActive).toEqual(false)
    expect(model.composerOpts).toBeUndefined()
  })
})
