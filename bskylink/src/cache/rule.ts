export type RuleEventType = '#addRule' | '#updateRule' | '#removeRule'
export type RulePatternType = '#domain' | '#url'
export type RuleActionType = '#block' | '#warn' | '#whitelist'
export type RuleReasonType = '#csam' | '#spam' | '#phishing' | '#none'

export interface Rule {
  id: number
  eventType: RuleEventType
  url: string
  pattern: RulePatternType
  action: RuleActionType
  reason: RuleReasonType
  createdBy: string // DID format
  createdAt: string // ISO datetime string
  comment?: string
}

// Example Rule object
export const exampleRule: Rule = {
  id: 1,
  eventType: '#addRule',
  url: 'https://malicious.example.com/phishing',
  pattern: '#domain',
  action: '#block',
  reason: '#phishing',
  createdBy: 'did:plc:adminozonetools',
  createdAt: '2024-06-01T12:00:00Z',
  comment: 'Known phishing domain detected by automated scan.',
}
