import {NativeModule, requireNativeModule} from 'expo'

declare class EmojiPickerModule extends NativeModule {}

export default requireNativeModule<EmojiPickerModule>('EmojiPicker')
