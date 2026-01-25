import * as toast from '#/components/Toast';
export var convertLegacyToastType = function (type) {
    switch (type) {
        // these ones are fine
        case 'default':
        case 'success':
        case 'error':
        case 'warning':
        case 'info':
            return type;
        // legacy ones need conversion
        case 'xmark':
            return 'error';
        case 'exclamation-circle':
            return 'warning';
        case 'check':
            return 'success';
        case 'clipboard-check':
            return 'success';
        case 'circle-exclamation':
            return 'warning';
        default:
            return 'default';
    }
};
/**
 * @deprecated use {@link toast} instead
 */
export function show(message, type) {
    if (type === void 0) { type = 'default'; }
    var convertedType = convertLegacyToastType(type);
    toast.show(message, { type: convertedType });
}
