var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useMemo } from 'react';
import { ToolsOzoneReportDefs as OzoneReportDefs } from '@atproto/api';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export function useReportOptions() {
    var _ = useLingui()._;
    return useMemo(function () {
        var categories = {
            misleading: {
                key: 'misleading',
                title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Misleading"], ["Misleading"])))),
                description: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Spam or other inauthentic behavior or deception"], ["Spam or other inauthentic behavior or deception"])))),
                options: [
                    {
                        title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Spam"], ["Spam"])))),
                        reason: OzoneReportDefs.REASONMISLEADINGSPAM,
                    },
                    {
                        title: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Scam"], ["Scam"])))),
                        reason: OzoneReportDefs.REASONMISLEADINGSCAM,
                    },
                    {
                        title: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Fake account or bot"], ["Fake account or bot"])))),
                        reason: OzoneReportDefs.REASONMISLEADINGBOT,
                    },
                    {
                        title: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Impersonation"], ["Impersonation"])))),
                        reason: OzoneReportDefs.REASONMISLEADINGIMPERSONATION,
                    },
                    {
                        title: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["False information about elections"], ["False information about elections"])))),
                        reason: OzoneReportDefs.REASONMISLEADINGELECTIONS,
                    },
                    {
                        title: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Other misleading content"], ["Other misleading content"])))),
                        reason: OzoneReportDefs.REASONMISLEADINGOTHER,
                    },
                ],
            },
            sexualAdultContent: {
                key: 'sexualAdultContent',
                title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Adult content"], ["Adult content"])))),
                description: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Unlabeled, abusive, or non-consensual adult content"], ["Unlabeled, abusive, or non-consensual adult content"])))),
                options: [
                    {
                        title: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Unlabeled adult content"], ["Unlabeled adult content"])))),
                        reason: OzoneReportDefs.REASONSEXUALUNLABELED,
                    },
                    {
                        title: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Adult sexual abuse content"], ["Adult sexual abuse content"])))),
                        reason: OzoneReportDefs.REASONSEXUALABUSECONTENT,
                    },
                    {
                        title: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Non-consensual intimate imagery"], ["Non-consensual intimate imagery"])))),
                        reason: OzoneReportDefs.REASONSEXUALNCII,
                    },
                    {
                        title: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Deepfake adult content"], ["Deepfake adult content"])))),
                        reason: OzoneReportDefs.REASONSEXUALDEEPFAKE,
                    },
                    {
                        title: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Animal sexual abuse"], ["Animal sexual abuse"])))),
                        reason: OzoneReportDefs.REASONSEXUALANIMAL,
                    },
                    {
                        title: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Other sexual violence content"], ["Other sexual violence content"])))),
                        reason: OzoneReportDefs.REASONSEXUALOTHER,
                    },
                ],
            },
            harassmentHate: {
                key: 'harassmentHate',
                title: _(msg(templateObject_17 || (templateObject_17 = __makeTemplateObject(["Harassment or hate"], ["Harassment or hate"])))),
                description: _(msg(templateObject_18 || (templateObject_18 = __makeTemplateObject(["Abusive or discriminatory behavior"], ["Abusive or discriminatory behavior"])))),
                options: [
                    {
                        title: _(msg(templateObject_19 || (templateObject_19 = __makeTemplateObject(["Trolling"], ["Trolling"])))),
                        reason: OzoneReportDefs.REASONHARASSMENTTROLL,
                    },
                    {
                        title: _(msg(templateObject_20 || (templateObject_20 = __makeTemplateObject(["Targeted harassment"], ["Targeted harassment"])))),
                        reason: OzoneReportDefs.REASONHARASSMENTTARGETED,
                    },
                    {
                        title: _(msg(templateObject_21 || (templateObject_21 = __makeTemplateObject(["Hate speech"], ["Hate speech"])))),
                        reason: OzoneReportDefs.REASONHARASSMENTHATESPEECH,
                    },
                    {
                        title: _(msg(templateObject_22 || (templateObject_22 = __makeTemplateObject(["Doxxing"], ["Doxxing"])))),
                        reason: OzoneReportDefs.REASONHARASSMENTDOXXING,
                    },
                    {
                        title: _(msg(templateObject_23 || (templateObject_23 = __makeTemplateObject(["Other harassing or hateful content"], ["Other harassing or hateful content"])))),
                        reason: OzoneReportDefs.REASONHARASSMENTOTHER,
                    },
                ],
            },
            violencePhysicalHarm: {
                key: 'violencePhysicalHarm',
                title: _(msg(templateObject_24 || (templateObject_24 = __makeTemplateObject(["Violence"], ["Violence"])))),
                description: _(msg(templateObject_25 || (templateObject_25 = __makeTemplateObject(["Violent or threatening content"], ["Violent or threatening content"])))),
                options: [
                    {
                        title: _(msg(templateObject_26 || (templateObject_26 = __makeTemplateObject(["Animal welfare"], ["Animal welfare"])))),
                        reason: OzoneReportDefs.REASONVIOLENCEANIMAL,
                    },
                    {
                        title: _(msg(templateObject_27 || (templateObject_27 = __makeTemplateObject(["Threats or incitement"], ["Threats or incitement"])))),
                        reason: OzoneReportDefs.REASONVIOLENCETHREATS,
                    },
                    {
                        title: _(msg(templateObject_28 || (templateObject_28 = __makeTemplateObject(["Graphic violent content"], ["Graphic violent content"])))),
                        reason: OzoneReportDefs.REASONVIOLENCEGRAPHICCONTENT,
                    },
                    {
                        title: _(msg(templateObject_29 || (templateObject_29 = __makeTemplateObject(["Glorification of violence"], ["Glorification of violence"])))),
                        reason: OzoneReportDefs.REASONVIOLENCEGLORIFICATION,
                    },
                    {
                        title: _(msg(templateObject_30 || (templateObject_30 = __makeTemplateObject(["Extremist content"], ["Extremist content"])))),
                        reason: OzoneReportDefs.REASONVIOLENCEEXTREMISTCONTENT,
                    },
                    {
                        title: _(msg(templateObject_31 || (templateObject_31 = __makeTemplateObject(["Human trafficking"], ["Human trafficking"])))),
                        reason: OzoneReportDefs.REASONVIOLENCETRAFFICKING,
                    },
                    {
                        title: _(msg(templateObject_32 || (templateObject_32 = __makeTemplateObject(["Other violent content"], ["Other violent content"])))),
                        reason: OzoneReportDefs.REASONVIOLENCEOTHER,
                    },
                ],
            },
            childSafety: {
                key: 'childSafety',
                title: _(msg(templateObject_33 || (templateObject_33 = __makeTemplateObject(["Child safety"], ["Child safety"])))),
                description: _(msg(templateObject_34 || (templateObject_34 = __makeTemplateObject(["Harming or endangering minors"], ["Harming or endangering minors"])))),
                options: [
                    {
                        title: _(msg(templateObject_35 || (templateObject_35 = __makeTemplateObject(["Child Sexual Abuse Material (CSAM)"], ["Child Sexual Abuse Material (CSAM)"])))),
                        reason: OzoneReportDefs.REASONCHILDSAFETYCSAM,
                    },
                    {
                        title: _(msg(templateObject_36 || (templateObject_36 = __makeTemplateObject(["Grooming or predatory behavior"], ["Grooming or predatory behavior"])))),
                        reason: OzoneReportDefs.REASONCHILDSAFETYGROOM,
                    },
                    {
                        title: _(msg(templateObject_37 || (templateObject_37 = __makeTemplateObject(["Privacy violation of a minor"], ["Privacy violation of a minor"])))),
                        reason: OzoneReportDefs.REASONCHILDSAFETYPRIVACY,
                    },
                    {
                        title: _(msg(templateObject_38 || (templateObject_38 = __makeTemplateObject(["Minor harassment or bullying"], ["Minor harassment or bullying"])))),
                        reason: OzoneReportDefs.REASONCHILDSAFETYHARASSMENT,
                    },
                    {
                        title: _(msg(templateObject_39 || (templateObject_39 = __makeTemplateObject(["Other child safety issue"], ["Other child safety issue"])))),
                        reason: OzoneReportDefs.REASONCHILDSAFETYOTHER,
                    },
                ],
            },
            selfHarm: {
                key: 'selfHarm',
                title: _(msg(templateObject_40 || (templateObject_40 = __makeTemplateObject(["Self-harm or dangerous behaviors"], ["Self-harm or dangerous behaviors"])))),
                description: _(msg(templateObject_41 || (templateObject_41 = __makeTemplateObject(["Harmful or high-risk activities"], ["Harmful or high-risk activities"])))),
                options: [
                    {
                        title: _(msg(templateObject_42 || (templateObject_42 = __makeTemplateObject(["Content promoting or depicting self-harm"], ["Content promoting or depicting self-harm"])))),
                        reason: OzoneReportDefs.REASONSELFHARMCONTENT,
                    },
                    {
                        title: _(msg(templateObject_43 || (templateObject_43 = __makeTemplateObject(["Eating disorders"], ["Eating disorders"])))),
                        reason: OzoneReportDefs.REASONSELFHARMED,
                    },
                    {
                        title: _(msg(templateObject_44 || (templateObject_44 = __makeTemplateObject(["Dangerous challenges or activities"], ["Dangerous challenges or activities"])))),
                        reason: OzoneReportDefs.REASONSELFHARMSTUNTS,
                    },
                    {
                        title: _(msg(templateObject_45 || (templateObject_45 = __makeTemplateObject(["Dangerous substances or drug abuse"], ["Dangerous substances or drug abuse"])))),
                        reason: OzoneReportDefs.REASONSELFHARMSUBSTANCES,
                    },
                    {
                        title: _(msg(templateObject_46 || (templateObject_46 = __makeTemplateObject(["Other dangerous content"], ["Other dangerous content"])))),
                        reason: OzoneReportDefs.REASONSELFHARMOTHER,
                    },
                ],
            },
            ruleBreaking: {
                key: 'ruleBreaking',
                title: _(msg(templateObject_47 || (templateObject_47 = __makeTemplateObject(["Breaking site rules"], ["Breaking site rules"])))),
                description: _(msg(templateObject_48 || (templateObject_48 = __makeTemplateObject(["Banned activities or security violations"], ["Banned activities or security violations"])))),
                options: [
                    {
                        title: _(msg(templateObject_49 || (templateObject_49 = __makeTemplateObject(["Hacking or system attacks"], ["Hacking or system attacks"])))),
                        reason: OzoneReportDefs.REASONRULESITESECURITY,
                    },
                    {
                        title: _(msg(templateObject_50 || (templateObject_50 = __makeTemplateObject(["Promoting or selling prohibited items or services"], ["Promoting or selling prohibited items or services"])))),
                        reason: OzoneReportDefs.REASONRULEPROHIBITEDSALES,
                    },
                    {
                        title: _(msg(templateObject_51 || (templateObject_51 = __makeTemplateObject(["Banned user returning"], ["Banned user returning"])))),
                        reason: OzoneReportDefs.REASONRULEBANEVASION,
                    },
                    {
                        title: _(msg(templateObject_52 || (templateObject_52 = __makeTemplateObject(["Other network rule-breaking"], ["Other network rule-breaking"])))),
                        reason: OzoneReportDefs.REASONRULEOTHER,
                    },
                ],
            },
            other: {
                key: 'other',
                title: _(msg(templateObject_53 || (templateObject_53 = __makeTemplateObject(["Other"], ["Other"])))),
                description: _(msg(templateObject_54 || (templateObject_54 = __makeTemplateObject(["An issue not included in these options"], ["An issue not included in these options"])))),
                options: [
                    {
                        title: _(msg(templateObject_55 || (templateObject_55 = __makeTemplateObject(["Other"], ["Other"])))),
                        reason: OzoneReportDefs.REASONOTHER,
                    },
                ],
            },
        };
        return {
            categories: Object.values(categories),
            getCategory: function (reasonName) {
                return categories[reasonName];
            },
        };
    }, [_]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37, templateObject_38, templateObject_39, templateObject_40, templateObject_41, templateObject_42, templateObject_43, templateObject_44, templateObject_45, templateObject_46, templateObject_47, templateObject_48, templateObject_49, templateObject_50, templateObject_51, templateObject_52, templateObject_53, templateObject_54, templateObject_55;
