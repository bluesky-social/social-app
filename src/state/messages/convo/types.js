export var ConvoStatus;
(function (ConvoStatus) {
    ConvoStatus["Uninitialized"] = "uninitialized";
    ConvoStatus["Initializing"] = "initializing";
    ConvoStatus["Ready"] = "ready";
    ConvoStatus["Error"] = "error";
    ConvoStatus["Backgrounded"] = "backgrounded";
    ConvoStatus["Suspended"] = "suspended";
    ConvoStatus["Disabled"] = "disabled";
})(ConvoStatus || (ConvoStatus = {}));
export var ConvoItemError;
(function (ConvoItemError) {
    /**
     * Error connecting to event firehose
     */
    ConvoItemError["FirehoseFailed"] = "firehoseFailed";
    /**
     * Error fetching past messages
     */
    ConvoItemError["HistoryFailed"] = "historyFailed";
})(ConvoItemError || (ConvoItemError = {}));
export var ConvoErrorCode;
(function (ConvoErrorCode) {
    ConvoErrorCode["InitFailed"] = "initFailed";
})(ConvoErrorCode || (ConvoErrorCode = {}));
export var ConvoDispatchEvent;
(function (ConvoDispatchEvent) {
    ConvoDispatchEvent["Init"] = "init";
    ConvoDispatchEvent["Ready"] = "ready";
    ConvoDispatchEvent["Resume"] = "resume";
    ConvoDispatchEvent["Background"] = "background";
    ConvoDispatchEvent["Suspend"] = "suspend";
    ConvoDispatchEvent["Error"] = "error";
    ConvoDispatchEvent["Disable"] = "disable";
})(ConvoDispatchEvent || (ConvoDispatchEvent = {}));
