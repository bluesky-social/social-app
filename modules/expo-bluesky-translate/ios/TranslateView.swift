import SwiftUI
// conditionally import the Translation module
#if canImport(Translation)
import Translation
#endif

struct TranslateView: View {
  @ObservedObject var state = TranslateViewState.shared

  var body: some View {
    if #available(iOS 17.4, *) {
      VStack {
        UIViewRepresentableWrapper(view: UIView(frame: .zero))
      }
      .translationPresentation(
        isPresented: $state.isPresented,
        text: state.text
      )
    }
  }
}

struct UIViewRepresentableWrapper: UIViewRepresentable {
  let view: UIView

  func makeUIView(context: Context) -> UIView {
    return view
  }

  func updateUIView(_ uiView: UIView, context: Context) {}
}
