import 'array.prototype.findlast/auto'
import 'setimmediate'

/*
 * NOTE: the webpack-era console.error wrapper that re-threw react-native-web's
 * "Unexpected text node" warnings as redboxes was removed with the Metro
 * migration. Metro's LogBox already surfaces console.error prominently, and
 * any wrapper around console.error becomes the top stack frame of every
 * captured error, making Metro attribute all of them to this file.
 */

export {}
