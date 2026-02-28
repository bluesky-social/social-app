var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var VideoTooLargeError = /** @class */ (function (_super) {
    __extends(VideoTooLargeError, _super);
    function VideoTooLargeError() {
        var _this = _super.call(this, 'Videos cannot be larger than 100 MB') || this;
        _this.name = 'VideoTooLargeError';
        return _this;
    }
    return VideoTooLargeError;
}(Error));
export { VideoTooLargeError };
var ServerError = /** @class */ (function (_super) {
    __extends(ServerError, _super);
    function ServerError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'ServerError';
        return _this;
    }
    return ServerError;
}(Error));
export { ServerError };
var UploadLimitError = /** @class */ (function (_super) {
    __extends(UploadLimitError, _super);
    function UploadLimitError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'UploadLimitError';
        return _this;
    }
    return UploadLimitError;
}(Error));
export { UploadLimitError };
