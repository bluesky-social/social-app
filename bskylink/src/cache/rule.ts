import {type SafelinkRule} from '../db/schema'

export const exampleRule: SafelinkRule = {
  id: 1,
  eventType: 'addRule',
  url: 'https://malicious.example.com/phishing',
  pattern: 'domain',
  action: 'block',
  reason: 'phishing',
  createdBy: 'did:plc:adminozonetools',
  createdAt: '2024-06-01T12:00:00Z',
  comment: 'Known phishing domain detected by automated scan.',
}
