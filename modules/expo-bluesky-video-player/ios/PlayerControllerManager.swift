import AVKit

class PlayerControllerManager {
  static let shared = PlayerControllerManager()
  
  private var controllers: [PlayerController] = []
  private let max = 10
  
  func getPlayer() -> PlayerController? {
    if let controller = self.controllers.first(where: { $0.isInUse == false }) {
      return controller
    } else if controllers.count < self.max {
      let controller = PlayerController()
      controllers.append(controller)
      return controller
    }
    return nil
  }
  
  func releasePlayer(controller: PlayerController) {
    if let controller = controllers.first(where: { $0 === controller }) {
      controller.release()
    }
  }
  
  func findBySource(source: String) -> PlayerController? {
    if let controller = controllers.first(where: { $0.source == source}) {
      return controller
    }
    return nil
  }
}
