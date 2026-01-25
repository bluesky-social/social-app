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
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { logger } from '#/logger';
import { ErrorScreen } from './error/ErrorScreen';
import { CenteredView } from './Views';
var ErrorBoundary = /** @class */ (function (_super) {
    __extends(ErrorBoundary, _super);
    function ErrorBoundary() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            hasError: false,
            error: undefined,
        };
        return _this;
    }
    ErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    ErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        logger.error(error, { errorInfo: errorInfo });
    };
    ErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            if (this.props.renderError) {
                return this.props.renderError(this.state.error);
            }
            return (_jsx(CenteredView, { style: [{ height: '100%', flex: 1 }, this.props.style], children: _jsx(TranslatedErrorScreen, { details: this.state.error.toString() }) }));
        }
        return this.props.children;
    };
    return ErrorBoundary;
}(Component));
export { ErrorBoundary };
function TranslatedErrorScreen(_a) {
    var details = _a.details;
    var _ = useLingui()._;
    return (_jsx(ErrorScreen, { title: _(msg(templateObject_1 || (templateObject_1 = __makeTemplateObject(["Oh no!"], ["Oh no!"])))), message: _(msg(templateObject_2 || (templateObject_2 = __makeTemplateObject(["There was an unexpected issue in the application. Please let us know if this happened to you!"], ["There was an unexpected issue in the application. Please let us know if this happened to you!"])))), details: details }));
}
var templateObject_1, templateObject_2;
