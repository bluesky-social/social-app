import AVKit

class PlayerItemManager {
  static let shared = PlayerItemManager()
  
  private var items: [(String, AVPlayerItem)] = []
  private let max = 30
  
  private func addItem(source: String) -> AVPlayerItem? {
    guard let url = URL(string: source) else {
      return nil
    }
    
    if items.count >= self.max {
      let first = self.items.removeFirst()
      self.removeItem(source: first.0)
    }
    
    let item = AVPlayerItem(url: url)
    self.items.append((source, item))
    
    return item
  }
  
  func getOrAddItem(source: String) -> AVPlayerItem? {
    if let index = items.firstIndex(where: { $0.0 == source }) {
      let item = self.items[index]
      self.items.move(fromOffsets: IndexSet(integer: index), toOffset: self.items.count - 1)
      return item.1
    }
    
    return self.addItem(source: source)
  }
  
  func removeItem(source: String?) {
    guard let source = source else {
      return
    }
    
    if let controller = PlayerControllerManager.shared.findBySource(source: source) {
      controller.release()
    }
  }
}
