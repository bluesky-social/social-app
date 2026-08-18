/*
 * Used ONLY by the web typecheck pass (tsconfig.check.web.json) - it is
 * excluded from the other passes and has no runtime effect.
 *
 * Some packages publish .web.d.ts declarations that diverge from the API
 * the app is written against (or, worse, raw TypeScript sources that break
 * under `moduleSuffixes: [".web", ""]`), so this pins them to their native
 * declarations. react-native-svg has the same problem, handled by deleting
 * its divergent web declarations in patches/react-native-svg@15.12.1.patch
 * so resolution falls through to the native ones.
 */

/*
 * Side-effect CSS imports in .web files are handled by the bundler.
 */
declare module '*.css'

/*
 * expo-file-system's declarations build File/Directory on top of
 * `./ExpoFileSystem`, which remaps to a web shim whose classes are empty.
 * As of SDK 57 the fully-typed base classes live in
 * internal/NativeFileSystem.types (no .web sibling), so mirror the File.d.ts
 * and Directory.d.ts wrapper classes on top of those.
 */
declare module 'expo-file-system' {
  import {
    NativeFileSystemDirectory as ExpoFileSystemDirectory,
    NativeFileSystemFile as ExpoFileSystemFile,
  } from 'expo-file-system/build/internal/NativeFileSystem.types'
  export {
    type DirectoryCreateOptions,
    type DirectoryInfo,
    type DownloadOptions,
    EncodingType,
    type FileCreateOptions,
    type FileHandle,
    type FileInfo,
    type FileWriteOptions,
    type InfoOptions,
    type PathInfo,
  } from 'expo-file-system/build/FileSystem.types'
  import {type PathInfo as ExpoPathInfo} from 'expo-file-system/build/FileSystem.types'
  import {
    type WatchEvent,
    type WatchOptions,
    type WatchSubscription,
  } from 'expo-file-system/build/FileSystemWatcher.types'
  import {
    type DownloadTask,
    type UploadTask,
  } from 'expo-file-system/build/NetworkTasks'
  import {
    type DownloadTaskOptions,
    type UploadOptions,
    type UploadResult,
  } from 'expo-file-system/build/NetworkTasks.types'
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
    json(): Promise<unknown>
    formData(): ReturnType<Response['formData']>
    stream(): ReadableStream<Uint8Array<ArrayBuffer>>
    slice(start?: number, end?: number, contentType?: string): Blob
    upload(url: string, options?: UploadOptions): Promise<UploadResult>
    createUploadTask(url: string, options?: UploadOptions): UploadTask
    static createDownloadTask(
      url: string,
      destination: File | Directory,
      options?: DownloadTaskOptions,
    ): DownloadTask
    watch(
      callback: (event: WatchEvent<File>) => void,
      options?: WatchOptions,
    ): WatchSubscription
  }

  export class Directory extends ExpoFileSystemDirectory {
    constructor(...uris: (string | File | Directory)[])
    get parentDirectory(): Directory
    list(): (Directory | File)[]
    get name(): string
    createFile(name: string, mimeType: string | null): File
    createDirectory(name: string): Directory
    watch(
      callback: (event: WatchEvent<File | Directory>) => void,
      options?: WatchOptions,
    ): WatchSubscription
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
