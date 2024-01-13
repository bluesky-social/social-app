import ExpoModulesCore

public class ExpoSelectableTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoSelectableText")

    View(ExpoSelectableTextView.self) {
      Events("onTextPress", "onTextLongPress", "onTextLayout")

      Prop("segments") { (view: ExpoSelectableTextView, prop: String) in
        // Convert the JSON to segments
        if let data = prop.data(using: .utf8) {
          print("first")
          if let segments = try? JSONDecoder().decode(TextSegments.self, from: data) {
            print("second")
            view.segments = segments.segments
          }
        }
      }

      Prop("rootStyle") { (view: ExpoSelectableTextView, prop: String) in
        if let data = prop.data(using: .utf8) {
          if let style = try? JSONDecoder().decode(TextStyle.self, from: data) {
            view.style = style
          }
        }
      }

      Prop("selectable") { (view: ExpoSelectableTextView, prop: Bool) in
        view.textView.isSelectable = prop
      }

      Prop("children") { (view: ExpoSelectableTextView, prop: JavaScriptValue) in
        print(prop)
      }
    }
  }
}
