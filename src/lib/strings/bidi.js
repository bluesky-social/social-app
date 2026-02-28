var LEFT_TO_RIGHT_EMBEDDING = '\u202A';
var POP_DIRECTIONAL_FORMATTING = '\u202C';
/*
 * Force LTR directionality in a string.
 * https://www.unicode.org/reports/tr9/#Directional_Formatting_Characters
 */
export function forceLTR(str) {
    return LEFT_TO_RIGHT_EMBEDDING + str + POP_DIRECTIONAL_FORMATTING;
}
