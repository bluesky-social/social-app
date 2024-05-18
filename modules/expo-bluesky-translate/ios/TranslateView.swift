import SwiftUI
import Translation

struct TranslateView: View {
  @ObservedObject var props: TranslateViewProps

  var body: some View {
    if #available(iOS 17.4, *) {
      VStack {
        ForEach(props.children?.indices ?? 0..<0, id: \.self) { index in
          UIViewRepresentableWrapper(view: props.children?[index] ?? UIView())
            .frame(
              width: props.children?[index].frame.width,
              height: props.children?[index].frame.height)
        }
      }
      .translationPresentation(
        isPresented: $props.isPresented,
        text: props.text
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
