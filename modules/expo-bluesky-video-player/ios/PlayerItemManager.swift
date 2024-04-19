import Foundation
import AVKit
import CryptoKit

class PlayerItemManager {
  static let shared = PlayerItemManager()
  
  private var prefetchQueue: [String] = []
  private var assets = NSMapTable<NSString, AVURLAsset>(keyOptions: .strongMemory, valueOptions: .weakMemory)
  
  func getAsset(source: String) -> AVURLAsset? {
    
    
    let path = createPath(source)
    
    if let asset = assets.object(forKey: NSString(string: source)) {
      return asset
    }

    if FileManager.default.fileExists(atPath: path.path) {
      guard let asset = AVAsset(url: path) as? AVURLAsset else {
        return nil
      }
      self.assets.setObject(asset, forKey: NSString(string: source))
      return asset
    } else if let url = URL(string: source) {
      guard let asset = AVAsset(url: url) as? AVURLAsset else {
        return nil
      }
      self.assets.setObject(asset, forKey: NSString(string: source))
      return asset
    }
    return nil
  }
  
  func saveToCache(source: String) {
    guard let sourceUrl = URL(string: source) else {
      return
    }
    
    let path = createPath(sourceUrl.absoluteString)
    let downloadTask = URLSession.shared.downloadTask(with:sourceUrl) { tempLocalURL, response, error in
      if let tempLocalURL = tempLocalURL, error == nil {
        try? FileManager.default.moveItem(at: tempLocalURL, to: path)
      }
    }
    downloadTask.resume()
  }
  
  private func getHash(_ source: String) -> String {
    let data = Data(source.utf8)
    let hash = Insecure.SHA1.hash(data: data)
    return hash.map { String(format: "%02hhx", $0)}.joined()
  }
  
  private func getGifsDirectory() -> URL {
    let paths = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
    var cacheDir = paths[0]
    cacheDir = cacheDir.appendingPathComponent("gifs", isDirectory: true)
    
    if !FileManager.default.fileExists(atPath: cacheDir.path) {
      try? FileManager.default.createDirectory(at: cacheDir, withIntermediateDirectories: false)
    }
    
    return cacheDir
  }
  
  private func createPath(_ source: String) -> URL {
    let hash = getHash(source)
    let gifsDir = getGifsDirectory()
    return gifsDir.appendingPathComponent("\(hash).mp4", isDirectory: false)
  }
}
