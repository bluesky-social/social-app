/*
 * iOS keeps the previously-shipping BlockDrawerGesture wrapper, which works
 * correctly here. Only Android needs the new drawer-side wait mechanism.
 * See APP-2119.
 */
export {BlockDrawerGesture as DrawerWaitGesture} from './BlockDrawerGesture'
