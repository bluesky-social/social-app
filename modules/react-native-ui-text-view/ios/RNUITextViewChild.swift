class RNUITextViewChild: UIView {
  @objc var text: String = "" {
    didSet {
      print(text)
      let superview = self.superview as? RNUITextView
    }
  }
  @objc var textStyle: TextStyle? {
    didSet {
      print(textStyle)
    }
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}
