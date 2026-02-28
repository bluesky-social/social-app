export var formatCount = function (i18n, num) {
    return i18n.number(num, {
        notation: 'compact',
        maximumFractionDigits: 1,
        roundingMode: 'trunc',
    });
};
