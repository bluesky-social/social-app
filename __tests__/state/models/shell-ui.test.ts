import {
  ConfirmModal,
  ImageLightbox,
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

  it('should call the setDarkMode method', () => {
    model.setDarkMode(true)
    expect(model.darkMode).toEqual(true)

    model.setDarkMode(false)
    expect(model.darkMode).toEqual(false)
  })

  it('should call the setMinimalShellMode method', () => {
    model.setMinimalShellMode(true)
    expect(model.minimalShellMode).toEqual(true)

    model.setMinimalShellMode(false)
    expect(model.minimalShellMode).toEqual(false)
  })

  it('should call the setMainMenuOpen method', () => {
    model.setMainMenuOpen(true)
    expect(model.isMainMenuOpen).toEqual(true)

    model.setMainMenuOpen(false)
    expect(model.isMainMenuOpen).toEqual(false)
  })

  it('should call the openModal & closeModal method', () => {
    model.openModal(ConfirmModal)
    expect(model.isModalActive).toEqual(true)
    expect(model.activeModal).toEqual(ConfirmModal)

    model.closeModal()
    expect(model.isModalActive).toEqual(false)
    expect(model.activeModal).toBeUndefined()
  })

  it('should call the openLightbox & closeLightbox method', () => {
    model.openLightbox(new ImageLightbox('uri'))
    expect(model.isLightboxActive).toEqual(true)
    expect(model.activeLightbox).toEqual(new ImageLightbox('uri'))

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
