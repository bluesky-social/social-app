import ExpoModulesCore

public class ExpoPlatformInfoModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoPlatformInfo")
    
    Function("getIsReducedMotion") {
      return UIAccessibility.isReduceMotionEnabled
    }
  }
}
