export var MessagesEventBusStatus;
(function (MessagesEventBusStatus) {
    MessagesEventBusStatus["Initializing"] = "initializing";
    MessagesEventBusStatus["Ready"] = "ready";
    MessagesEventBusStatus["Error"] = "error";
    MessagesEventBusStatus["Backgrounded"] = "backgrounded";
    MessagesEventBusStatus["Suspended"] = "suspended";
})(MessagesEventBusStatus || (MessagesEventBusStatus = {}));
export var MessagesEventBusDispatchEvent;
(function (MessagesEventBusDispatchEvent) {
    MessagesEventBusDispatchEvent["Ready"] = "ready";
    MessagesEventBusDispatchEvent["Error"] = "error";
    MessagesEventBusDispatchEvent["Background"] = "background";
    MessagesEventBusDispatchEvent["Suspend"] = "suspend";
    MessagesEventBusDispatchEvent["Resume"] = "resume";
    MessagesEventBusDispatchEvent["UpdatePoll"] = "updatePoll";
})(MessagesEventBusDispatchEvent || (MessagesEventBusDispatchEvent = {}));
export var MessagesEventBusErrorCode;
(function (MessagesEventBusErrorCode) {
    MessagesEventBusErrorCode["Unknown"] = "unknown";
    MessagesEventBusErrorCode["InitFailed"] = "initFailed";
    MessagesEventBusErrorCode["PollFailed"] = "pollFailed";
})(MessagesEventBusErrorCode || (MessagesEventBusErrorCode = {}));
