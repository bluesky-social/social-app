class RNUITextView: UIView {
  var textView: UITextView

  @objc var numberOfLines: Int = 0 {
    didSet {
      print(numberOfLines)
      textView.textContainer.maximumNumberOfLines = numberOfLines
    }
  }

  override init(frame: CGRect) {
    if #available(iOS 16.0, *) {
      textView = UITextView(usingTextLayoutManager: false)
    } else {
      textView = UITextView()
    }

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
    self.clipsToBounds = true

    // Add the view
    addSubview(textView)

    let tapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(callOnPress(_:)))
    tapGestureRecognizer.isEnabled = true
    textView.addGestureRecognizer(tapGestureRecognizer)
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

  func setText(string: NSAttributedString, size: CGSize, numberOfLines: Int) -> Void {
    self.textView.frame.size = size
    self.textView.textContainer.maximumNumberOfLines = numberOfLines
    self.textView.attributedText = string
  }

  @IBAction func callOnPress(_ sender: UITapGestureRecognizer) -> Void {
    // If we find a child, then call onPress
    if let child = getPressed(sender) {
      if textView.selectedTextRange == nil, let onPress = child.onPress {
        onPress(["": ""])
      } else {
        // Clear the selected text range if we are not pressing on a link
        textView.selectedTextRange = nil
      }
    }
  }

  // Try to get the pressed segment
  func getPressed(_ sender: UITapGestureRecognizer) -> RNUITextViewChild? {
    let layoutManager = textView.layoutManager
    var location = sender.location(in: textView)

    // Remove the padding
    location.x -= textView.textContainerInset.left
    location.y -= textView.textContainerInset.top

    // Get the index of the char
    let charIndex = layoutManager.characterIndex(
      for: location,
      in: textView.textContainer,
      fractionOfDistanceBetweenInsertionPoints: nil
    )

    let text = textView.attributedText.string

    for child in self.subviews {
      guard let child = child as? RNUITextViewChild, let text = child.text else {
        continue
      }

      let range = text.range(of: text)

      if let lowerBound = range?.lowerBound, let upperBound = range?.upperBound {
        if charIndex >= lowerBound.utf16Offset(in: text) && charIndex <= upperBound.utf16Offset(in: text) {
          return child
        }
      }
    }

    return nil
  }
}
