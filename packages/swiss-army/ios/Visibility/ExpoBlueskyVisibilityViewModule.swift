import ExpoModulesCore

public class ExpoBlueskyVisibilityViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyVisibilityView")

    AsyncFunction("updateActiveViewAsync") {
      VisibilityViewManager.shared.updateActiveView()
    }

    View(VisibilityView.self) {
      Events([
        "onChangeStatus"
      ])

      Prop("enabled") { (view: VisibilityView, prop: Bool) in
        view.enabled = prop
      }
    }
  }
}
