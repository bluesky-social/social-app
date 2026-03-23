import {type SafelinkRule} from '../db/schema'

export const exampleRule: SafelinkRule = {
  id: 1,
  eventType: 'addRule',
  url: 'https://malicious.example.com/phishing',
  pattern: 'domain',
  action: 'block',
  createdAt: '2024-06-01T12:00:00Z',
}
