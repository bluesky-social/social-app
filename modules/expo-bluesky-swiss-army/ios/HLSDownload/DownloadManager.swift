//
//  DownloadManager.swift
//  ExpoBlueskySwissArmy
//
//  Created by Hailey on 7/29/24.
//

class DownloadManager {
  static let shared = DownloadManager()
  
  private let downloads: NSMapTable<NSString, HLSDownload> = NSMapTable(keyOptions: .weakMemory, valueOptions: .weakMemory)
  
  func add(_ hlsDownload: HLSDownload) {
    let key = hlsDownload.sourceUrl.absoluteString as NSString
    downloads.setObject(hlsDownload, forKey: key)
  }
  
  func remove(string: String) {
    let key = string as NSString
    downloads.removeObject(forKey: key)
  }
  
  func remove(hlsDownload: HLSDownload) {
    let key = hlsDownload.sourceUrl.absoluteString as NSString
    downloads.setObject(hlsDownload, forKey: key)
  }
  
  func getForSource(url: URL) -> HLSDownload? {
    let key = url.absoluteString as NSString
    return downloads.object(forKey: key)
  }
  
  func getForSource(string: String) -> HLSDownload? {
    let key = string as NSString
    return downloads.object(forKey: key)
  }
  
  func cancel(url: URL) {
    let download = self.getForSource(url: url)
    download?.cancel()
  }
  
  func cancelAll() {
    let downloadsEnumerator = downloads.objectEnumerator()
    while let download = downloadsEnumerator?.nextObject() {
      let download = download as? HLSDownload
      download?.cancel()
    }
  }
}
