import ExpoModulesCore

public class ExpoGanderVisibilityViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGanderVisibilityView")

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
