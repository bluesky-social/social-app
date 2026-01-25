var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { jsx as _jsx } from "react/jsx-runtime";
import { Fragment, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@discord/bottom-sheet/src';
import { usePalette } from '#/lib/hooks/usePalette';
import { useModalControls, useModals } from '#/state/modals';
import { FullWindowOverlay } from '#/components/FullWindowOverlay';
import { createCustomBackdrop } from '../util/BottomSheetCustomBackdrop';
import * as DeleteAccountModal from './DeleteAccount';
import * as ContentLanguagesSettingsModal from './lang-settings/ContentLanguagesSettings';
import * as UserAddRemoveListsModal from './UserAddRemoveLists';
var DEFAULT_SNAPPOINTS = ['90%'];
var HANDLE_HEIGHT = 24;
export function ModalsContainer() {
    var _this = this;
    var _a = useModals(), isModalActive = _a.isModalActive, activeModals = _a.activeModals;
    var closeModal = useModalControls().closeModal;
    var bottomSheetRef = useRef(null);
    var pal = usePalette('default');
    var activeModal = activeModals[activeModals.length - 1];
    var onBottomSheetChange = function (snapPoint) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (snapPoint === -1) {
                closeModal();
            }
            return [2 /*return*/];
        });
    }); };
    var onClose = function () {
        var _a;
        (_a = bottomSheetRef.current) === null || _a === void 0 ? void 0 : _a.close();
        closeModal();
    };
    useEffect(function () {
        var _a, _b;
        if (isModalActive) {
            (_a = bottomSheetRef.current) === null || _a === void 0 ? void 0 : _a.snapToIndex(0);
        }
        else {
            (_b = bottomSheetRef.current) === null || _b === void 0 ? void 0 : _b.close();
        }
    }, [isModalActive, bottomSheetRef, activeModal === null || activeModal === void 0 ? void 0 : activeModal.name]);
    var snapPoints = DEFAULT_SNAPPOINTS;
    var element;
    if ((activeModal === null || activeModal === void 0 ? void 0 : activeModal.name) === 'user-add-remove-lists') {
        snapPoints = UserAddRemoveListsModal.snapPoints;
        element = _jsx(UserAddRemoveListsModal.Component, __assign({}, activeModal));
    }
    else if ((activeModal === null || activeModal === void 0 ? void 0 : activeModal.name) === 'delete-account') {
        snapPoints = DeleteAccountModal.snapPoints;
        element = _jsx(DeleteAccountModal.Component, {});
    }
    else if ((activeModal === null || activeModal === void 0 ? void 0 : activeModal.name) === 'content-languages-settings') {
        snapPoints = ContentLanguagesSettingsModal.snapPoints;
        element = _jsx(ContentLanguagesSettingsModal.Component, {});
    }
    else {
        return null;
    }
    if (snapPoints[0] === 'fullscreen') {
        return (_jsx(SafeAreaView, { style: [styles.fullscreenContainer, pal.view], children: element }));
    }
    var Container = activeModal ? FullWindowOverlay : Fragment;
    return (_jsx(Container, { children: _jsx(BottomSheet, { ref: bottomSheetRef, snapPoints: snapPoints, handleHeight: HANDLE_HEIGHT, index: isModalActive ? 0 : -1, enablePanDownToClose: true, android_keyboardInputMode: "adjustResize", keyboardBlurBehavior: "restore", backdropComponent: isModalActive ? createCustomBackdrop(onClose) : undefined, handleIndicatorStyle: { backgroundColor: pal.text.color }, handleStyle: [styles.handle, pal.view], backgroundStyle: pal.view, onChange: onBottomSheetChange, children: element }) }));
}
var styles = StyleSheet.create({
    handle: {
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    fullscreenContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
    },
});
