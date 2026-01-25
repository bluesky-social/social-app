import { jsx as _jsx } from "react/jsx-runtime";
import { StyleSheet } from 'react-native';
import { usePalette } from '#/lib/hooks/usePalette';
import { toPostLanguages, useLanguagePrefs } from '#/state/preferences/languages';
import { ToggleButton } from '#/view/com/util/forms/ToggleButton';
export function LanguageToggle(_a) {
    var code2 = _a.code2, name = _a.name, onPress = _a.onPress, langType = _a.langType;
    var pal = usePalette('default');
    var langPrefs = useLanguagePrefs();
    var values = langType === 'contentLanguages'
        ? langPrefs.contentLanguages
        : toPostLanguages(langPrefs.postLanguage);
    var isSelected = values.includes(code2);
    // enforce a max of 3 selections for post languages
    var isDisabled = false;
    if (langType === 'postLanguages' && values.length >= 3 && !isSelected) {
        isDisabled = true;
    }
    return (_jsx(ToggleButton, { label: name, isSelected: isSelected, onPress: isDisabled ? undefined : onPress, style: [pal.border, styles.languageToggle, isDisabled && styles.dimmed] }));
}
var styles = StyleSheet.create({
    languageToggle: {
        borderTopWidth: 1,
        borderRadius: 0,
        paddingHorizontal: 6,
        paddingVertical: 12,
    },
    dimmed: {
        opacity: 0.5,
    },
});
