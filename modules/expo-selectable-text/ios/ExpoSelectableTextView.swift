import Foundation
import ExpoModulesCore

class ExpoSelectableTextView: ExpoView {
  var textView: UITextView
  var segments: Array<TextSegment> = [] {
    didSet {
      // We don't want to set the text if the root style has not been set yet
      self.setText()
    }
  }
  var style: TextStyle? {
    didSet {
      // If the text has not been set and there are segments, set the text
      self.setText()
    }
  }

  let onTextPress = EventDispatcher()
  let onTextLongPress = EventDispatcher()
  let onTextLayout = EventDispatcher()

  public required init(appContext: AppContext? = nil) {
    if #available(iOS 16.0, *) {
      textView = UITextView(usingTextLayoutManager: false)
    } else {
      textView = UITextView()
    }

    super.init(appContext: appContext)

    // Configure default appearance
    textView.scrollsToTop = false
    textView.isEditable = false
    textView.isScrollEnabled = false
    textView.backgroundColor = .clear

    // Remove all of the padding from the view
    textView.textContainerInset = UIEdgeInsets.zero
    textView.textContainer.lineFragmentPadding = 0

    // Add the text view to the root view
    self.addSubview(textView)

    // Configure the press recognizer
    let tapGestureRecognizer = UITapGestureRecognizer(target: self, action: #selector(callOnPress(_:)))
    textView.addGestureRecognizer(tapGestureRecognizer)
  }

  override func layoutSubviews() -> Void {
    // Set the textView's frame on layout
    setSize()
  }

  @IBAction func callOnPress(_ sender: UITapGestureRecognizer) -> Void {
    if let segment = getPressedSegment(sender) {
      if segment.handlePress, textView.selectedTextRange == nil {
        onTextPress([
          "index": segment.index
        ])
      } else {
        // Clear the selected text range if we are not pressing on a link
        textView.selectedTextRange = nil
      }
    }
  }

  func setSize() -> Void {
    // Figure out the height of our text and create a CGRect
    let maxWidth = bounds.width
    let sizeThatFits = textView.sizeThatFits(CGSize(width: maxWidth, height: CGFloat(MAXFLOAT)))
    let size = CGSize(width: maxWidth, height: sizeThatFits.height)
    textView.frame.size = size

    onTextLayout([
      "height": sizeThatFits.height,
      "width": maxWidth
    ])
  }

  func setText() -> Void {
    let finalAttributedString = NSMutableAttributedString()

    segments.forEach { segment in
      // Set some generic attributes that don't need ranges
      let attributes: [NSAttributedString.Key:Any] = [
        .font: UIFont.systemFont(ofSize: segment.style?.fontSize ?? self.style?.fontSize ?? 12.0, weight: segment.style?.fontWeight?.toFontWeight() ?? self.style?.fontWeight?.toFontWeight() ?? .regular),
        .foregroundColor: ExpoSelectableTextUtil.hexToUIColor(hex: segment.style?.color),
      ]

      // Create the attributed string with the generic attributes
      let string = NSMutableAttributedString(string: segment.text, attributes: attributes)

      // Set the paragraph style attributes if necessary
      if let lineHeight = segment.style?.lineHeight {
        let paragraphStyle = NSMutableParagraphStyle()
        paragraphStyle.minimumLineHeight = lineHeight
        paragraphStyle.maximumLineHeight = lineHeight
        string.addAttribute(NSAttributedString.Key.paragraphStyle, value: paragraphStyle, range: NSMakeRange(0, string.length))
      }

      if let textDecorationLine = segment.style?.textDecorationLine {
        if textDecorationLine == .underline || textDecorationLine == .underlineLineThrough {
          string.addAttribute(NSAttributedString.Key.underlineStyle, value: NSUnderlineStyle.single.rawValue, range: NSMakeRange(0, string.length))
        }

        if textDecorationLine == .lineThrough || textDecorationLine == .underlineLineThrough {
          string.addAttribute(NSAttributedString.Key.strikethroughStyle, value: NSUnderlineStyle.single.rawValue, range: NSMakeRange(0, string.length))
        }
      }

      finalAttributedString.append(string)
    }

    textView.attributedText = finalAttributedString

    self.setNeedsLayout()
  }

  func getPressedSegment(_ sender: UITapGestureRecognizer) -> TextSegment? {
    let layoutManager = textView.layoutManager
    var location = sender.location(in: textView)

    // Remove the padding
    location.x -= textView.textContainerInset.left
    location.y -= textView.textContainerInset.top

    // Get the index of the char
    let charIndex = layoutManager.characterIndex(for: location, in: textView.textContainer, fractionOfDistanceBetweenInsertionPoints: nil)

    let text = textView.attributedText.string
    var foundSegment: TextSegment?

    // Check each segment
    segments.forEach { segment in
      let range = text.range(of: segment.text)
      // Figure out the bounds
      if let lowerBound = range?.lowerBound, let upperBound = range?.upperBound {
        if charIndex >= lowerBound.utf16Offset(in: text), charIndex <= upperBound.utf16Offset(in: text) {
          foundSegment = segment
        }
      }
    }

    return foundSegment
  }
}
