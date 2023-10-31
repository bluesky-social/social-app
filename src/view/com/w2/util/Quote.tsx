export interface QuoteInfo {
  bIsQuote: boolean
  asQuote: string | undefined
  orig: string | undefined
}
export function IsQuote(text?: string): QuoteInfo {
  // iOS software keyboards will insert leftQuotationMark-rightQuotationMark pairs
  if (text && (text.startsWith('""') || text.startsWith('“”')))
    return {bIsQuote: true, asQuote: text.slice(2).trim(), orig: text}
  return {bIsQuote: false, asQuote: undefined, orig: text}
}
