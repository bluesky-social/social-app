/*
 * Used ONLY by the web typecheck pass (tsconfig.check.web.json) - it is not
 * included by the main tsconfig, and it has no runtime effect. See
 * react-native-svg.web-check.d.ts for the full background on why some
 * packages need to be pinned to their native declarations under
 * `moduleSuffixes: [".web", ""]`.
 */

/*
 * Side-effect CSS imports in .web files are handled by the bundler.
 */
declare module '*.css'

/*
 * expo-file-system's declarations build File/Directory on top of
 * `./ExpoFileSystem`, which remaps to a web shim whose classes are empty.
 * The fully-typed base classes live in ExpoFileSystem.types (no .web
 * sibling), so mirror the FileSystem.d.ts wrapper classes on top of those.
 */
declare module 'expo-file-system' {
  import {
    Directory as ExpoFileSystemDirectory,
    File as ExpoFileSystemFile,
  } from 'expo-file-system/build/ExpoFileSystem.types'
  export {
    type DirectoryCreateOptions,
    type DirectoryInfo,
    type DownloadOptions,
    EncodingType,
    type FileCreateOptions,
    FileHandle,
    type FileInfo,
    type FileWriteOptions,
    type InfoOptions,
    type PathInfo,
  } from 'expo-file-system/build/ExpoFileSystem.types'
  import {type PathInfo as ExpoPathInfo} from 'expo-file-system/build/ExpoFileSystem.types'
  import {PathUtilities} from 'expo-file-system/build/pathUtilities'

  export class Paths extends PathUtilities {
    static get cache(): Directory
    static get bundle(): Directory
    static get document(): Directory
    static get appleSharedContainers(): Record<string, Directory>
    static get totalDiskSpace(): number
    static get availableDiskSpace(): number
    static info(...uris: string[]): ExpoPathInfo
  }

  export class File extends ExpoFileSystemFile implements Blob {
    constructor(...uris: (string | File | Directory)[])
    get parentDirectory(): Directory
    get extension(): string
    get name(): string
    readableStream(): ReadableStream<Uint8Array<ArrayBuffer>>
    writableStream(): WritableStream<Uint8Array<ArrayBufferLike>>
    arrayBuffer(): Promise<ArrayBuffer>
    stream(): ReadableStream<Uint8Array<ArrayBuffer>>
    slice(start?: number, end?: number, contentType?: string): Blob
  }

  export class Directory extends ExpoFileSystemDirectory {
    constructor(...uris: (string | File | Directory)[])
    get parentDirectory(): Directory
    list(): (Directory | File)[]
    get name(): string
    createFile(name: string, mimeType: string | null): File
    createDirectory(name: string): Directory
  }
}

/*
 * expo-image-manipulator's web declarations export the module class where
 * the native ones export an instance, hiding instance methods such as
 * `manipulate` from `typeof ImageManipulator`. Mirror the native surface.
 */
declare module 'expo-image-manipulator' {
  import {type ImageManipulator as ImageManipulatorModule} from 'expo-image-manipulator/build/ImageManipulator.types'
  export const ImageManipulator: ImageManipulatorModule
  export {
    manipulateAsync,
    useImageManipulator,
  } from 'expo-image-manipulator/build/ImageManipulator'
  export {
    type Action,
    type ActionCrop,
    type ActionExtent,
    type ActionFlip,
    type ActionResize,
    type ActionRotate,
    FlipType,
    type ImageResult,
    SaveFormat,
    type SaveOptions,
  } from 'expo-image-manipulator/build/ImageManipulator.types'
  export {type ImageManipulatorContext} from 'expo-image-manipulator/build/ImageManipulatorContext'
  export {type ImageRef} from 'expo-image-manipulator/build/ImageRef'
}
