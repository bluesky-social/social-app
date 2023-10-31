export type WImageInput = {
  b64Image: string
  alt: string
}

export type WLinkMetaInput = {
  url: string
  title?: string
  description?: string
  image?: string
  b64Image?: string
}

export type WExtLinkInput = {
  uri: string
  meta?: WLinkMetaInput
}

export type MiniBlogInput = {
  groupDid: string
  longText: string
  imageData?: WImageInput
  extLinkData?: WExtLinkInput
}
