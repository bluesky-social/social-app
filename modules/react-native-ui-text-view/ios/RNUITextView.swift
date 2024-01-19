class RNUITextView: UIView {
  var textView: UITextView

  @objc var numberOfLines: Int = 0 {
    didSet {
      print(numberOfLines)
      textView.textContainer.maximumNumberOfLines = numberOfLines
    }
  }

  override init(frame: CGRect) {
    self.textView = UITextView()

    // Disable scrolling
    textView.isScrollEnabled = false
    // Remove all the padding
    textView.textContainerInset = .zero
    textView.textContainer.lineFragmentPadding = 0

    // Remove other properties
    textView.isEditable = false
    textView.backgroundColor = .clear

    // Init
    super.init(frame: frame)

    // Add the view
    addSubview(textView)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  // Resolves some animation issues
  override func reactSetFrame(_ frame: CGRect) {
    UIView.performWithoutAnimation {
      super.reactSetFrame(frame)
    }
  }

  override func didUpdateReactSubviews() {
    // Do nothing
  }

  func setText(string: NSAttributedString, size: CGSize, numberOfLines: Int) -> Void {
    self.textView.frame.size = size
    self.textView.textContainer.maximumNumberOfLines = numberOfLines
    self.textView.attributedText = string
  }

  @IBAction func callOnPress(_ sender: UITapGestureRecognizer) -> Void {
    // If we find a child, then call onPress
//    if let child = getPressed(sender) {
//      if textView.selectedTextRange == nil {
//        child.onTextPress()
//      } else {
//        // Clear the selected text range if we are not pressing on a link
//        textView.selectedTextRange = nil
//      }
//    }
  }
}
