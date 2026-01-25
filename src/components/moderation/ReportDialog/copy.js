var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { useMemo } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
export function useCopyForSubject(subject) {
    var _ = useLingui()._;
    return useMemo(function () {
        switch (subject.type) {
            case 'account': {
                return {
                    title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Report this user"], ["Report this user"])))),
                    subtitle: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["Why should this user be reviewed?"], ["Why should this user be reviewed?"])))),
                };
            }
            case 'status': {
                return {
                    title: _(msg(templateObject_3 || (templateObject_3 = __makeTemplateObject(["Report this livestream"], ["Report this livestream"])))),
                    subtitle: _(msg(templateObject_4 || (templateObject_4 = __makeTemplateObject(["Why should this livestream be reviewed?"], ["Why should this livestream be reviewed?"])))),
                };
            }
            case 'post': {
                return {
                    title: _(msg(templateObject_5 || (templateObject_5 = __makeTemplateObject(["Report this post"], ["Report this post"])))),
                    subtitle: _(msg(templateObject_6 || (templateObject_6 = __makeTemplateObject(["Why should this post be reviewed?"], ["Why should this post be reviewed?"])))),
                };
            }
            case 'list': {
                return {
                    title: _(msg(templateObject_7 || (templateObject_7 = __makeTemplateObject(["Report this list"], ["Report this list"])))),
                    subtitle: _(msg(templateObject_8 || (templateObject_8 = __makeTemplateObject(["Why should this list be reviewed?"], ["Why should this list be reviewed?"])))),
                };
            }
            case 'feed': {
                return {
                    title: _(msg(templateObject_9 || (templateObject_9 = __makeTemplateObject(["Report this feed"], ["Report this feed"])))),
                    subtitle: _(msg(templateObject_10 || (templateObject_10 = __makeTemplateObject(["Why should this feed be reviewed?"], ["Why should this feed be reviewed?"])))),
                };
            }
            case 'starterPack': {
                return {
                    title: _(msg(templateObject_11 || (templateObject_11 = __makeTemplateObject(["Report this starter pack"], ["Report this starter pack"])))),
                    subtitle: _(msg(templateObject_12 || (templateObject_12 = __makeTemplateObject(["Why should this starter pack be reviewed?"], ["Why should this starter pack be reviewed?"])))),
                };
            }
            case 'convoMessage': {
                switch (subject.view) {
                    case 'convo': {
                        return {
                            title: _(msg(templateObject_13 || (templateObject_13 = __makeTemplateObject(["Report this conversation"], ["Report this conversation"])))),
                            subtitle: _(msg(templateObject_14 || (templateObject_14 = __makeTemplateObject(["Why should this conversation be reviewed?"], ["Why should this conversation be reviewed?"])))),
                        };
                    }
                    case 'message': {
                        return {
                            title: _(msg(templateObject_15 || (templateObject_15 = __makeTemplateObject(["Report this message"], ["Report this message"])))),
                            subtitle: _(msg(templateObject_16 || (templateObject_16 = __makeTemplateObject(["Why should this message be reviewed?"], ["Why should this message be reviewed?"])))),
                        };
                    }
                }
            }
        }
    }, [_, subject]);
}
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16;
