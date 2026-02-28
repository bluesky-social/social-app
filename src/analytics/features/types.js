export var Features;
(function (Features) {
    // core flags
    Features["IsBskyTeam"] = "is_bsky_team";
    // debug flags
    Features["DebugFeedContext"] = "debug_feed_context";
    // feature flags
    Features["ImportContactsOnboardingDisable"] = "import_contacts:onboarding:disable";
    Features["ImportContactsSettingsDisable"] = "import_contacts:settings:disable";
    Features["LiveNowBetaDisable"] = "live_now_beta:disable";
    Features["AATest"] = "aa-test";
})(Features || (Features = {}));
