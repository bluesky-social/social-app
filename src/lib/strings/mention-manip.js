export function getMentionAt(text, cursorPos) {
    var re = /(^|\s)@([a-z0-9.-]*)/gi;
    var match;
    while ((match = re.exec(text))) {
        var spaceOffset = match[1].length;
        var index = match.index + spaceOffset;
        if (cursorPos >= index &&
            cursorPos <= index + match[0].length - spaceOffset) {
            return { value: match[2], index: index };
        }
    }
    return undefined;
}
export function insertMentionAt(text, cursorPos, mention) {
    var target = getMentionAt(text, cursorPos);
    if (target) {
        return "".concat(text.slice(0, target.index), "@").concat(mention, " ").concat(text.slice(target.index + target.value.length + 1));
    }
    return text;
}
