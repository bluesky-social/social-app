class RNUITextViewShadow: RCTShadowView {
  // Props
  @objc var numberOfLines: Int = 0 {
    didSet {
      if !YGNodeIsDirty(self.yogaNode) {
        self.setAttributedText()
      }
    }
  }
  @objc var allowsFontScaling: Bool = true

  var attributedText: NSAttributedString = NSAttributedString()
  var frameSize: CGSize = CGSize()

  var lineHeight: CGFloat = 0

  var bridge: RCTBridge

  init(bridge: RCTBridge) {
    self.bridge = bridge
    super.init()

    // We need to set a custom measure func here to calculate the height correctly
    YGNodeSetMeasureFunc(self.yogaNode) { node, width, widthMode, height, heightMode in
      // Get the shadowview and determine the needed size to set
      let shadowView = Unmanaged<RNUITextViewShadow>.fromOpaque(YGNodeGetContext(node)).takeUnretainedValue()
      return shadowView.getNeededSize(maxWidth: width)
    }

    // Subscribe to ynamic type size changes
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(preferredContentSizeChanged(_:)),
      name: UIContentSizeCategory.didChangeNotification,
      object: nil
    )
  }

  @objc func preferredContentSizeChanged(_ notification: Notification) {
    self.setAttributedText()
  }

  // Returning true here will tell Yoga to not use flexbox and instead use our custom measure func.
  override func isYogaLeafNode() -> Bool {
    return true
  }

  // We should only insert children that are UITextView shadows
  override func insertReactSubview(_ subview: RCTShadowView!, at atIndex: Int) {
    if subview.isKind(of: RNUITextViewChildShadow.self) {
      super.insertReactSubview(subview, at: atIndex)
    }
  }

  // Every time the subviews change, we need to reformat and render the text.
  override func didUpdateReactSubviews() {
    self.setAttributedText()
  }

  // Whenever we layout, update the UI
  override func layoutSubviews(with layoutContext: RCTLayoutContext) {
    // Don't do anything if the layout is dirty
    if(YGNodeIsDirty(self.yogaNode)) {
      return
    }

    // Since we are inside the shadow view here, we have to find the real view and update the text.
    self.bridge.uiManager.addUIBlock { uiManager, viewRegistry in
      guard let textView = viewRegistry?[self.reactTag] as? RNUITextView else {
        return
      }
      textView.setText(string: self.attributedText, size: self.frameSize, numberOfLines: self.numberOfLines)
    }
  }

  override func dirtyLayout() {
    super.dirtyLayout()
    YGNodeMarkDirty(self.yogaNode)
  }

  // Update the attributed text whenever changes are made to the subviews.
  func setAttributedText() -> Void {
    // Create an attributed string to store each of the segments
    let finalAttributedString = NSMutableAttributedString()

    self.reactSubviews().forEach { child in
      guard let child = child as? RNUITextViewChildShadow else {
        return
      }
      let scaledFontSize = self.allowsFontScaling ?
        UIFontMetrics.default.scaledValue(for: child.fontSize) : child.fontSize
      let font = UIFont.systemFont(ofSize: scaledFontSize, weight: child.getFontWeight())

      // Set some generic attributes that don't need ranges
      let attributes: [NSAttributedString.Key:Any] = [
        .font: font,
        .foregroundColor: child.color,
      ]

      // Create the attributed string with the generic attributes
      let string = NSMutableAttributedString(string: child.text, attributes: attributes)

      // Set the paragraph style attributes if necessary. We can check this by seeing if the provided
      // line height is not 0.0.
      let paragraphStyle = NSMutableParagraphStyle()
      if child.lineHeight != 0.0 {
        // Whenever we change the line height for the text, we are also removing the DynamicType
        // adjustment for line height. We need to get the multiplier and apply that to the
        // line height.
        let scaleMultiplier = scaledFontSize / child.fontSize
        paragraphStyle.minimumLineHeight = child.lineHeight * scaleMultiplier
        paragraphStyle.maximumLineHeight = child.lineHeight * scaleMultiplier

        string.addAttribute(
          NSAttributedString.Key.paragraphStyle,
          value: paragraphStyle,
          range: NSMakeRange(0, string.length)
        )

        // To calcualte the size of the text without creating a new UILabel or UITextView, we have
        // to store this line height for later.
        self.lineHeight = child.lineHeight
      } else {
        self.lineHeight = font.lineHeight
      }

      finalAttributedString.append(string)
    }

    self.attributedText = finalAttributedString
    self.dirtyLayout()
  }

  // To create the needed size we need to:
  // 1. Get the max size that we can use for the view
  // 2. Calculate the height of the text based on that max size
  // 3. Determine how many lines the text is, and limit that number if it exceeds the max
  // 4. Set the frame size and return the YGSize. YGSize requires Float values while CGSize needs CGFloat
  func getNeededSize(maxWidth: Float) -> YGSize {
    let maxSize = CGSize(width: CGFloat(maxWidth), height: CGFloat(MAXFLOAT))
    let textSize = self.attributedText.boundingRect(with: maxSize, options: .usesLineFragmentOrigin, context: nil)

    var totalLines = Int(ceil(textSize.height / self.lineHeight))

    if self.numberOfLines != 0, totalLines > self.numberOfLines {
      totalLines = self.numberOfLines
    }

    self.frameSize = CGSize(width: CGFloat(maxWidth), height: CGFloat(CGFloat(totalLines) * self.lineHeight))
    return YGSize(width: Float(self.frameSize.width), height: Float(self.frameSize.height))
  }
}
