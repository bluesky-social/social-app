import { describe, expect, it } from '@jest/globals';
import { parseLinkingUrl } from '../parseLinkingUrl';
describe('parseLinkingUrl', function () {
    it('should correctly parse bluesky:// URLs', function () {
        var url = 'bluesky://intent/age-assurance?result=success&actorDid=did:example:123';
        var urlp = parseLinkingUrl(url);
        expect(urlp.protocol).toBe('bluesky:');
        expect(urlp.host).toBe('');
        expect(urlp.pathname).toBe('/intent/age-assurance');
    });
    it('should correctly parse standard URLs', function () {
        var url = 'https://bsky.app/intent/age-assurance?result=success&actorDid=did:example:123';
        var urlp = parseLinkingUrl(url);
        expect(urlp.protocol).toBe('https:');
        expect(urlp.host).toBe('bsky.app');
        expect(urlp.pathname).toBe('/intent/age-assurance');
    });
});
