"use strict";
var EMBED_URL = window.EMBED_URL || 'https://embed.bsky.app';
window.bluesky = window.bluesky || {
    scan: scan,
};
/**
 * Listen for messages from the Bluesky embed iframe and adjust the height of
 * the iframe accordingly.
 */
window.addEventListener('message', function (event) {
    if (event.origin !== EMBED_URL) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    var id = event.data.id;
    if (!id) {
        return;
    }
    var embed = document.querySelector("[data-bluesky-id=\"".concat(id, "\"]"));
    if (!embed) {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    var height = event.data.height;
    if (height) {
        embed.style.height = "".concat(height, "px");
    }
});
/**
 * Scan the document for all elements with the data-bluesky-aturi attribute,
 * and initialize them as Bluesky embeds.
 *
 * @param element Only scan this specific element @default document @optional
 * @returns
 */
function scan(node) {
    if (node === void 0) { node = document; }
    var embeds = node.querySelectorAll('[data-bluesky-uri]');
    for (var i = 0; i < embeds.length; i++) {
        var id = String(Math.random()).slice(2);
        var embed = embeds[i];
        var aturi = embed.getAttribute('data-bluesky-uri');
        if (!aturi) {
            continue;
        }
        var ref_url = location.origin + location.pathname;
        var searchParams = new URLSearchParams();
        searchParams.set('id', id);
        if (ref_url.startsWith('http')) {
            searchParams.set('ref_url', encodeURIComponent(ref_url));
        }
        if (embed.dataset.blueskyEmbedColorMode) {
            searchParams.set('colorMode', embed.dataset.blueskyEmbedColorMode);
        }
        var iframe = document.createElement('iframe');
        iframe.setAttribute('data-bluesky-id', id);
        iframe.src = "".concat(EMBED_URL, "/embed/").concat(aturi.slice('at://'.length), "?").concat(searchParams.toString());
        iframe.width = '100%';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.style.flexGrow = '1';
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        var container = document.createElement('div');
        container.style.maxWidth = '600px';
        container.style.width = '100%';
        container.style.marginTop = '10px';
        container.style.marginBottom = '10px';
        container.style.display = 'flex';
        container.className = 'bluesky-embed';
        container.appendChild(iframe);
        embed.replaceWith(container);
    }
}
if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
    scan();
}
else {
    document.addEventListener('DOMContentLoaded', function () { return scan(); });
}
