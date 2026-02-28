/**
 * DO NOT IMPORT THIS DIRECTLY
 *
 * Logger contexts, defined here and used via `Logger.Context.*` static prop.
 */
export var LogContext;
(function (LogContext) {
    LogContext["Default"] = "logger";
    LogContext["Session"] = "session";
    LogContext["Notifications"] = "notifications";
    LogContext["ConversationAgent"] = "conversation-agent";
    LogContext["DMsAgent"] = "dms-agent";
    LogContext["ReportDialog"] = "report-dialog";
    LogContext["FeedFeedback"] = "feed-feedback";
    LogContext["PostSource"] = "post-source";
    LogContext["AgeAssurance"] = "age-assurance";
    LogContext["PolicyUpdate"] = "policy-update";
    LogContext["Geolocation"] = "geolocation";
    LogContext["Drafts"] = "drafts";
    /**
     * METRIC IS FOR INTERNAL USE ONLY, don't create any other loggers using this
     * context
     */
    LogContext["Metric"] = "metric";
})(LogContext || (LogContext = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel["Debug"] = "debug";
    LogLevel["Info"] = "info";
    LogLevel["Log"] = "log";
    LogLevel["Warn"] = "warn";
    LogLevel["Error"] = "error";
})(LogLevel || (LogLevel = {}));
