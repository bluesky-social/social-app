var BroadcastChannel = /** @class */ (function () {
    function BroadcastChannel(name) {
        this.name = name;
        this.onmessage = function () { };
    }
    BroadcastChannel.prototype.postMessage = function (_data) { };
    BroadcastChannel.prototype.close = function () { };
    BroadcastChannel.prototype.addEventListener = function (_type, _listener) { };
    BroadcastChannel.prototype.removeEventListener = function (_type, _listener) { };
    return BroadcastChannel;
}());
export default BroadcastChannel;
