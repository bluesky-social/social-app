import ExpoModulesCore

public class ExpoScrollForwarderModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoScrollForwarder")
    
    View(ExpoScrollForwarderView.self) {
      // Defines a setter for the `name` prop.
      Prop("scrollViewTag") { (view: ExpoScrollForwarderView, prop: Int) in
        view.
      }
    }
  }
}
