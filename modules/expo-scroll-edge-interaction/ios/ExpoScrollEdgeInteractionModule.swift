import ExpoModulesCore

public class ExpoScrollEdgeInteractionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoScrollEdgeInteraction")

    View(ExpoScrollEdgeInteractionView.self) {
      Prop("nodeHandle") { (view: ExpoScrollEdgeInteractionView, prop: Int?) in
        view.nodeHandle = prop
      }
      Prop("scrollViewTag") { (view: ExpoScrollEdgeInteractionView, prop: Int?) in
        view.scrollViewTag = prop
      }
      Prop("edge") { (view: ExpoScrollEdgeInteractionView, prop: String?) in
        view.edge = prop
      }
    }
  }
}
