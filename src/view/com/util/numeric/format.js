export var formatCount = function (i18n, num) {
    return i18n.number(num, {
        notation: 'compact',
        maximumFractionDigits: 1,
        // @ts-expect-error - roundingMode not in the types
        roundingMode: 'trunc',
    });
};
