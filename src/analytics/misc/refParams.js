/**
 * This is used for our own Bluesky post embeds, and maybe other things.
 *
 * In the case of our embeds, `ref_src=embed`. Not sure if `ref_url` is used.
 */
var _a, _b;
import * as env from '#/env';
var refSrc = '';
var refUrl = '';
if (env.IS_WEB) {
    var params = new URLSearchParams(window.location.search);
    refSrc = (_a = params.get('ref_src')) !== null && _a !== void 0 ? _a : '';
    refUrl = decodeURIComponent((_b = params.get('ref_url')) !== null && _b !== void 0 ? _b : '');
}
export var src = refSrc;
export var url = refUrl;
