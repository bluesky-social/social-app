import ExpoModulesCore

class ExpoUITextView: ExpoView {
  var textView: UITextView
  var textChildren: [ExpoUITextViewChild] = []

  let onTextLayout = EventDispatcher()

  // Props

  public required init(appContext: AppContext? = nil) {
    if #available(iOS 16.0, *) {
      textView = UITextView(usingTextLayoutManager: false)
    } else {
      textView = UITextView()
    }

    // Configure default appearance
    textView.scrollsToTop = false
    textView.isEditable = false
    textView.isScrollEnabled = false
    textView.backgroundColor = .clear

    // Remove all of the padding from the view
    textView.textContainerInset = UIEdgeInsets.zero
    textView.textContainer.lineFragmentPadding = 0

    super.init(appContext: appContext)

    addSubview(textView)

    // Configure the tap gesture recognizer
    let tapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(callOnPress(_:)))
    tapGestureRecognizer.isEnabled = true
    textView.addGestureRecognizer(tapGestureRecognizer)

    // Listen for dynamic type changes
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(preferredContentSizeChanged(_:)),
      name: UIContentSizeCategory.didChangeNotification,
      object: nil
    )
  }

  // Update children whenever new react subviews are added
  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    if subview.isKind(of: ExpoUITextViewChild.self) {
      insertSubview(subview, at: atIndex)
      self.getTextChildren()
    }
  }

  // Do the same whenever subviews are removed
  override func removeReactSubview(_ subview: UIView!) {
    if subview.isKind(of: ExpoUITextViewChild.self) {
      subview.removeFromSuperview()
    }
  }

  override func reactSubviews() -> [UIView]! {
    return subviews
  }

  override func layoutSubviews() {
    // Get the width from the bounds
    let maxWidth = bounds.width
    // Calculate the size of the text
    let sizeThatFits = textView.sizeThatFits(CGSize(width: maxWidth, height: CGFloat(MAXFLOAT)))
    let size = CGSize(width: maxWidth, height: sizeThatFits.height)

    // Set the textview's frame
    textView.frame.size = size
    self.appContext?.reactBridge?.uiManager.setSize(size, for: self)

    // Get each line and call onTextLayout
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

  @objc func preferredContentSizeChanged(_ notification: Notification) {
    self.setText()
  }

  @IBAction func callOnPress(_ sender: UITapGestureRecognizer) -> Void {
    // If we find a child, then call onPress
    if let child = getPressed(sender) {
      if textView.selectedTextRange == nil {
        child.onTextPress()
      } else {
        // Clear the selected text range if we are not pressing on a link
        textView.selectedTextRange = nil
      }
    }
  }

  // Try to get the pressed segment
  func getPressed(_ sender: UITapGestureRecognizer) -> ExpoUITextViewChild? {
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
    var foundChild: ExpoUITextViewChild?

    // Check each segment
    self.textChildren.forEach { child in
      let range = text.range(of: child.text ?? "")
      // Figure out the bounds
      if let lowerBound = range?.lowerBound, let upperBound = range?.upperBound {
        if charIndex >= lowerBound.utf16Offset(in: text), charIndex <= upperBound.utf16Offset(in: text) {
          foundChild = child
        }
      }
    }

    return foundChild
  }

  // Get the children. Always use getTextChildren() so that we ensure the correct order of views
  func getTextChildren() -> Void {
    var children: [ExpoUITextViewChild] = []

    self.reactSubviews().forEach { view in
      if view.isKind(of: ExpoUITextViewChild.self) {
        children.append(view as! ExpoUITextViewChild)
      }
    }

    // Save the children for our onPress handler
    self.textChildren = children
    // Update the UITextView with the styled text
    self.setText()
  }

  func setText() -> Void {
    // Create an attributed string to store each of the segments
    let finalAttributedString = NSMutableAttributedString()

    self.textChildren.forEach { child in
      // If we don't have any text in this child, move to the next one
      guard let text = child.text else {
        return
      }

      let scaledFontSize = self.textView.adjustsFontForContentSizeCategory ?
        UIFontMetrics.default.scaledValue(for: child.style?.fontSize ?? 12.0) :
        child.style?.fontSize ?? 12.0

      // Set some generic attributes that don't need ranges
      let attributes: [NSAttributedString.Key:Any] = [
        .font: UIFont.systemFont(
          ofSize: scaledFontSize,
          weight: child.style?.fontWeight?.toFontWeight() ?? .regular
        ),
        .foregroundColor: TextUtil.hexToUIColor(hex: child.style?.color),
      ]

      // Create the attributed string with the generic attributes
      let string = NSMutableAttributedString(string: text, attributes: attributes)

      // Set the paragraph style attributes if necessary
      if let lineHeight = child.style?.lineHeight {
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.minimumLineHeight = lineHeight
        paragraphStyle.maximumLineHeight = lineHeight
        string.addAttribute(
          NSAttributedString.Key.paragraphStyle,
          value: paragraphStyle,
          range: NSMakeRange(0, string.length)
        )
      }

      if let textDecorationLine = child.style?.textDecorationLine {
        if textDecorationLine == .underline || textDecorationLine == .underlineLineThrough {
          string.addAttribute(
            NSAttributedString.Key.underlineStyle,
            value: NSUnderlineStyle.single.rawValue,
            range: NSMakeRange(0, string.length)
          )
        }

        if textDecorationLine == .lineThrough || textDecorationLine == .underlineLineThrough {
          string.addAttribute(
            NSAttributedString.Key.strikethroughStyle,
            value: NSUnderlineStyle.single.rawValue,
            range: NSMakeRange(0, string.length)
          )
        }
      }

      finalAttributedString.append(string)
    }

    textView.attributedText = finalAttributedString
    textView.selectedTextRange = nil

    self.setNeedsLayout()
  }
}
