import ExpoModulesCore

public class ExpoScrollForwarderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoScrollForwarder")
    
    View(ExpoScrollForwarderView.self) {
      // Still calling this scrollViewTag even though it is being converted to RCTScrollView
      Prop("scrollViewTag") { (view: ExpoScrollForwarderView, prop: RCTScrollView) in
        view.rctScrollView = prop
      }
    }
  }
}
