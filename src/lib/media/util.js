export function extractDataUriMime(uri) {
    return uri.substring(uri.indexOf(':') + 1, uri.indexOf(';'));
}
// Fairly accurate estimate that is more performant
// than decoding and checking length of URI
export function getDataUriSize(uri) {
    return Math.round((uri.length * 3) / 4);
}
export function isUriImage(uri) {
    return /\.(jpg|jpeg|png|webp).*$/.test(uri);
}
export function blobToDataUri(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            }
            else {
                reject(new Error('Failed to read blob'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
