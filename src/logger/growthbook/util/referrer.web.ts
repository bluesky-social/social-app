const params = new URLSearchParams(window.location.search)
export const src = params.get('ref_src') ?? ''
export const url = decodeURIComponent(params.get('ref_url') ?? '')
