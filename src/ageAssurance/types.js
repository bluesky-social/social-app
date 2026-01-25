import { logger } from '#/ageAssurance/logger';
export var AgeAssuranceAccess;
(function (AgeAssuranceAccess) {
    AgeAssuranceAccess["Unknown"] = "unknown";
    AgeAssuranceAccess["None"] = "none";
    AgeAssuranceAccess["Safe"] = "safe";
    AgeAssuranceAccess["Full"] = "full";
})(AgeAssuranceAccess || (AgeAssuranceAccess = {}));
export var AgeAssuranceStatus;
(function (AgeAssuranceStatus) {
    AgeAssuranceStatus["Unknown"] = "unknown";
    AgeAssuranceStatus["Pending"] = "pending";
    AgeAssuranceStatus["Assured"] = "assured";
    AgeAssuranceStatus["Blocked"] = "blocked";
})(AgeAssuranceStatus || (AgeAssuranceStatus = {}));
export function parseStatusFromString(raw) {
    switch (raw) {
        case 'unknown':
            return AgeAssuranceStatus.Unknown;
        case 'pending':
            return AgeAssuranceStatus.Pending;
        case 'assured':
            return AgeAssuranceStatus.Assured;
        case 'blocked':
            return AgeAssuranceStatus.Blocked;
        default:
            logger.error("parseStatusFromString: unknown status value: ".concat(raw));
            return AgeAssuranceStatus.Unknown;
    }
}
export function parseAccessFromString(raw) {
    switch (raw) {
        case 'unknown':
            return AgeAssuranceAccess.Unknown;
        case 'none':
            return AgeAssuranceAccess.None;
        case 'safe':
            return AgeAssuranceAccess.Safe;
        case 'full':
            return AgeAssuranceAccess.Full;
        default:
            logger.error("parseAccessFromString: unknown access value: ".concat(raw));
            return AgeAssuranceAccess.Full;
    }
}
