import ExpoModulesCore

public class ExpoScrollForwarderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoScrollForwarder")

    View(ExpoScrollForwarderView.self) {
      Prop("scrollViewTag") { (view: ExpoScrollForwarderView, prop: Int) in
        view.scrollViewTag = prop
      }
    }
  }
}
