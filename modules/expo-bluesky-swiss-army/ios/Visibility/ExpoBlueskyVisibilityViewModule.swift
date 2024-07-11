import ExpoModulesCore

public class ExpoBlueskyVisibilityViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyVisibilityView")

    View(VisibilityView.self) {
      Events([
        "onActiveChange"
      ])

      Prop("enabled") { (view: VisibilityView, prop: Bool) in
        view.enabled = prop
      }
    }
  }
}
