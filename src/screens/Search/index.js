import { jsx as _jsx } from "react/jsx-runtime";
import { SearchScreenShell } from './Shell';
export function SearchScreen(props) {
    var _a, _b, _c;
    var queryParam = (_c = (_b = (_a = props.route) === null || _a === void 0 ? void 0 : _a.params) === null || _b === void 0 ? void 0 : _b.q) !== null && _c !== void 0 ? _c : '';
    return (_jsx(SearchScreenShell, { queryParam: queryParam, testID: "searchScreen", isExplore: true }));
}
