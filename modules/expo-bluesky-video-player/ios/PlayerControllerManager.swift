import AVKit

class PlayerControllerManager {
  static let shared = PlayerControllerManager()
  
  private var controllers: [PlayerController] = []
  
  func getController() -> PlayerController {
    if let controller = self.controllers.first(where: { $0.isInUse == false }) {
      return controller
    } else {
      let controller = PlayerController()
      self.controllers.append(controller)
      return controller
    }
  }
  
  func releaseController(controller: PlayerController) {
    if let controller = self.controllers.first(where: { $0 === controller }) {
      controller.release()
    }
  }
  
  func findByItem(_ item: AVPlayerItem) -> PlayerController? {
    if let controller = self.controllers.first(where: { $0.playerItem === item}) {
      return controller
    }
    return nil
  }
  
  func cleanupExcessiveControllers() {
    if self.controllers.count <= 15 {
      return
    }
    
    self.controllers.removeAll { c in
      return !c.isInUse
    }
  }
}
