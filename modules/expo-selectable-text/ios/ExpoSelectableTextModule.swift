import ExpoModulesCore

public class ExpoSelectableTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSelectableText")

    View(ExpoSelectableTextView.self) {
      Events("onTextPress", "onTextLongPress", "onTextLayout")

      Prop("segments") { (view: ExpoSelectableTextView, prop: String) in
        // Convert the JSON to segments
        if let data = prop.data(using: .utf8) {
          if let segments = try? JSONDecoder().decode(TextSegments.self, from: data) {
            view.segments = segments.segments
          }
        }
      }

      Prop("selectable") { (view: ExpoSelectableTextView, prop: Bool) in
        view.textView.isSelectable = prop
      }

      Prop("rootStyle") { (view: ExpoSelectableTextView, prop: String) in
        if let data = prop.data(using: .utf8) {
          if let style = try? JSONDecoder().decode(TextStyle.self, from: data) {
            view.style = style
          }
        }
      }
    }
  }
}
