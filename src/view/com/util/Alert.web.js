var WebAlert = /** @class */ (function () {
    function WebAlert() {
    }
    WebAlert.prototype.alert = function (title, message, buttons) {
        var _a, _b;
        if (buttons === undefined || buttons.length === 0) {
            window.alert([title, message].filter(Boolean).join('\n'));
            return;
        }
        var result = window.confirm([title, message].filter(Boolean).join('\n'));
        if (result === true) {
            var confirm_1 = buttons.find(function (_a) {
                var style = _a.style;
                return style !== 'cancel';
            });
            (_a = confirm_1 === null || confirm_1 === void 0 ? void 0 : confirm_1.onPress) === null || _a === void 0 ? void 0 : _a.call(confirm_1);
            return;
        }
        var cancel = buttons.find(function (_a) {
            var style = _a.style;
            return style === 'cancel';
        });
        (_b = cancel === null || cancel === void 0 ? void 0 : cancel.onPress) === null || _b === void 0 ? void 0 : _b.call(cancel);
    };
    return WebAlert;
}());
export var Alert = new WebAlert();
