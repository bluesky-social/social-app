import ExpoModulesCore

public class ExpoProTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoProText")

    View(ExpoProTextView.self) {
      Events("onTextPress", "onTextLongPress")

      Prop("segments") { (view: ExpoProTextView, prop: String) in
        // Convert the JSON to segments
        if let data = prop.data(using: .utf8) {
          print("yes")
          if let segments = try? JSONDecoder().decode(TextSegments.self, from: data) {
            print("yes2")
            view.segments = segments.segments
          }
        }
      }

      Prop("selectable") { (view: ExpoProTextView, prop: Bool) in
        view.textView.isSelectable = prop
      }
    }
  }
}
