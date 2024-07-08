import ExpoModulesCore

public class ExpoBlueskyVisibilityViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyVisibilityView")
    
    View(VisibilityView.self) {
      Events([
        "onVisibilityChange"
      ])
    }
  }
}
