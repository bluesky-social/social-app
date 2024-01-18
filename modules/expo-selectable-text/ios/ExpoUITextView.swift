import ExpoModulesCore

class ExpoUITextView: ExpoView {
  var textView: UITextView
  var textChildren: [ExpoUITextViewChild] = [] {
    didSet {
      if textChildren != oldValue {
        self.setText()
      }
    }
  }

  let onTextLayout = EventDispatcher()

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

    // Restrain to bounds
    textView.clipsToBounds = true

    super.init(appContext: appContext)
    // Keep this view also within bounds
    self.clipsToBounds = true

    // Add the textview
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
    }
  }

  // Do the same whenever subviews are removed
  override func removeReactSubview(_ subview: UIView!) {
    subview.removeFromSuperview()
  }

  override func didSetProps(_ changedProps: [String]!) {
    self.setText()
  }

  // Just return the subviews
  override func reactSubviews() -> [UIView]! {
    return subviews
  }

  // Get children on update
  override func didUpdateReactSubviews() {
    self.updateChildren()
  }

  // Update the text whenever the DynamicType size changes
  @objc func preferredContentSizeChanged(_ notification: Notification) {
    self.setText()
  }

  // For animation issues
  // See: https://github.com/facebook/react-native/blob/258d8e51b451b221e557dad4647cbd210fe37392/packages/react-native/Libraries/Text/Text/RCTTextView.mm#L66
  override func reactSetFrame(_ frame: CGRect) {
    UIView.performWithoutAnimation {
      super.reactSetFrame(frame)
    }
  }

  override func layoutSubviews() {
    // Get the right size
    let height = textView.sizeThatFits(CGSize(width: bounds.width, height: CGFloat(MAXFLOAT))).height
    let size = CGSize(width: bounds.width, height: height)
    textView.frame.size = size
    // Set the textview's frame
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

  // Get the children. Always use getTextChildren() so that we ensure the correct order of views
  func updateChildren() -> Void {
    self.textChildren = self.reactSubviews().filter { view in
      if view.isKind(of: ExpoUITextViewChild.self) {
        return true
      }
      return false
    } as! [ExpoUITextViewChild]
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

    for child in self.textChildren {
      let range = text.range(of: child.text ?? "")

      if let lowerBound = range?.lowerBound, let upperBound = range?.upperBound {
        if charIndex >= lowerBound.utf16Offset(in: text) && charIndex <= upperBound.utf16Offset(in: text) {
          return child
        }
      }
    }

    return nil
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
