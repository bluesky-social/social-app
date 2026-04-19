import ExpoModulesCore

public class ExpoBlueskyContextMenuModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyContextMenu")

    View(ExpoBlueskyContextMenuView.self) {
      Events(["onItemPress", "onPreviewPress"])

      Prop("preview") { (view: ExpoBlueskyContextMenuView, value: [String: Any]?) in
        view.setPreview(value)
      }

      Prop("menuItems") { (view: ExpoBlueskyContextMenuView, value: [[String: Any]]) in
        view.setMenuItems(value)
      }

      Prop("previewCornerRadius") {
        (view: ExpoBlueskyContextMenuView, value: Double) in
        view.setPreviewCornerRadius(value)
      }
    }
  }
}
