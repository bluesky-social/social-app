class RNUITextView: UIView {
  var textView: UITextView

  @objc var numberOfLines: Int = 0 {
    didSet {
      textView.textContainer.maximumNumberOfLines = numberOfLines
    }
  }
  @objc var selectable: Bool = true {
    didSet {
      textView.isSelectable = selectable
    }
  }
  @objc var ellipsizeMode: String = "tail" {
    didSet {
      textView.textContainer.lineBreakMode = self.getLineBreakMode()
    }
  }
  @objc var onTextLayout: RCTDirectEventBlock?

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
    self.textView.selectedTextRange = nil

    if let onTextLayout = self.onTextLayout {
      var lines: [String] = []
      textView.layoutManager.enumerateLineFragments(
        forGlyphRange: NSRange(location: 0, length: textView.attributedText.length))
      { (rect, usedRect, textContainer, glyphRange, stop) in
        let characterRange = self.textView.layoutManager.characterRange(forGlyphRange: glyphRange, actualGlyphRange: nil)
        let line = (self.textView.text as NSString).substring(with: characterRange)
        lines.append(line)
      }

      onTextLayout([
        "lines": lines
      ])
    }
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

    var lastUpperBound: String.Index? = nil
    for child in self.reactSubviews() {
      if let child = child as? RNUITextViewChild, let childText = child.text {
        let fullText = self.textView.attributedText.string
        
        // We want to skip over the children we have already checked, otherwise we could run into
        // collisions of similar strings (i.e. links that get shortened to the same hostname but
        // different paths)
        let range = fullText.range(of: childText, options: [], range: (lastUpperBound ?? String.Index(utf16Offset: 0, in: fullText) )..<fullText.endIndex)
        
        if let lowerBound = range?.lowerBound, let upperBound = range?.upperBound {
          let lowerOffset = lowerBound.utf16Offset(in: fullText)
          let upperOffset = upperBound.utf16Offset(in: fullText)
          
          if charIndex >= lowerOffset,
             charIndex <= upperOffset
          {
            return child
          } else {
            lastUpperBound = upperBound
          }
        }
      }
    }

    return nil
  }

  func getLineBreakMode() -> NSLineBreakMode {
    switch self.ellipsizeMode {
    case "head":
      return .byTruncatingHead
    case "middle":
      return .byTruncatingMiddle
    case "tail":
      return .byTruncatingTail
    case "clip":
      return .byClipping
    default:
      return .byTruncatingTail
    }
  }
}
