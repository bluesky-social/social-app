import ExpoModulesCore

#if os(iOS)
import WidgetKit
#endif

public class ExpoBlueskyWidgetInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlueskyWidgetInfo")

    AsyncFunction("isInstalled") { (kind: String) async throws -> Bool in
      #if os(iOS)
      return try await withCheckedThrowingContinuation {
        (continuation: CheckedContinuation<Bool, Error>) in
        WidgetCenter.shared.getCurrentConfigurations { result in
          continuation.resume(
            with: result.map { configurations in
              configurations.contains { $0.kind == kind }
            }
          )
        }
      }
      #else
      return false
      #endif
    }
  }
}
