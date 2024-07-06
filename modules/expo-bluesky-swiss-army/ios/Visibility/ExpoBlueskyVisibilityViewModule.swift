import ExpoModulesCore

class ExpoBlueskyVisibilityViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBluskyVisibilityViewModule")
    
    View(VisibilityView.self) {
      Events([
        "onVisibilityChange"
      ])
    }
  }
}
