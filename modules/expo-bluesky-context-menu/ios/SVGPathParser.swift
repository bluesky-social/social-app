import UIKit

/// Minimal SVG path `d` parser. Handles the subset used by Bluesky's icon set:
/// M m L l H h V v C c S s Q q T t A a Z z.
/// Assumes well-formed input from the app's own compiled-in icon paths.
enum SVGPathParser {
  static func parse(_ d: String) -> UIBezierPath {
    let path = UIBezierPath()
    var tokens = Tokenizer(d)
    var currentPoint = CGPoint.zero
    var subpathStart = CGPoint.zero
    var lastControl: CGPoint?
    var lastQuadControl: CGPoint?
    var command: Character = "M"

    while let next = tokens.peek() {
      if next.isLetter {
        command = next
        tokens.consume()
      }

      switch command {
      case "M", "m":
        let p = tokens.readPoint()
        let abs = command == "M" ? p : CGPoint(x: currentPoint.x + p.x, y: currentPoint.y + p.y)
        path.move(to: abs)
        currentPoint = abs
        subpathStart = abs
        lastControl = nil
        lastQuadControl = nil
        // Subsequent coordinate pairs after M/m are implicit L/l
        command = command == "M" ? "L" : "l"

      case "L", "l":
        let p = tokens.readPoint()
        let abs = command == "L" ? p : CGPoint(x: currentPoint.x + p.x, y: currentPoint.y + p.y)
        path.addLine(to: abs)
        currentPoint = abs
        lastControl = nil
        lastQuadControl = nil

      case "H", "h":
        let x = tokens.readNumber()
        let abs = command == "H" ? CGPoint(x: x, y: currentPoint.y) : CGPoint(x: currentPoint.x + x, y: currentPoint.y)
        path.addLine(to: abs)
        currentPoint = abs
        lastControl = nil
        lastQuadControl = nil

      case "V", "v":
        let y = tokens.readNumber()
        let abs = command == "V" ? CGPoint(x: currentPoint.x, y: y) : CGPoint(x: currentPoint.x, y: currentPoint.y + y)
        path.addLine(to: abs)
        currentPoint = abs
        lastControl = nil
        lastQuadControl = nil

      case "C", "c":
        let c1 = tokens.readPoint()
        let c2 = tokens.readPoint()
        let p = tokens.readPoint()
        let (ac1, ac2, ap): (CGPoint, CGPoint, CGPoint)
        if command == "C" {
          ac1 = c1; ac2 = c2; ap = p
        } else {
          ac1 = CGPoint(x: currentPoint.x + c1.x, y: currentPoint.y + c1.y)
          ac2 = CGPoint(x: currentPoint.x + c2.x, y: currentPoint.y + c2.y)
          ap = CGPoint(x: currentPoint.x + p.x, y: currentPoint.y + p.y)
        }
        path.addCurve(to: ap, controlPoint1: ac1, controlPoint2: ac2)
        currentPoint = ap
        lastControl = ac2
        lastQuadControl = nil

      case "S", "s":
        let c2 = tokens.readPoint()
        let p = tokens.readPoint()
        let reflected = lastControl.map {
          CGPoint(x: 2 * currentPoint.x - $0.x, y: 2 * currentPoint.y - $0.y)
        } ?? currentPoint
        let (ac2, ap): (CGPoint, CGPoint)
        if command == "S" {
          ac2 = c2; ap = p
        } else {
          ac2 = CGPoint(x: currentPoint.x + c2.x, y: currentPoint.y + c2.y)
          ap = CGPoint(x: currentPoint.x + p.x, y: currentPoint.y + p.y)
        }
        path.addCurve(to: ap, controlPoint1: reflected, controlPoint2: ac2)
        currentPoint = ap
        lastControl = ac2
        lastQuadControl = nil

      case "Q", "q":
        let c = tokens.readPoint()
        let p = tokens.readPoint()
        let (ac, ap): (CGPoint, CGPoint)
        if command == "Q" {
          ac = c; ap = p
        } else {
          ac = CGPoint(x: currentPoint.x + c.x, y: currentPoint.y + c.y)
          ap = CGPoint(x: currentPoint.x + p.x, y: currentPoint.y + p.y)
        }
        path.addQuadCurve(to: ap, controlPoint: ac)
        currentPoint = ap
        lastControl = nil
        lastQuadControl = ac

      case "T", "t":
        let p = tokens.readPoint()
        let reflected = lastQuadControl.map {
          CGPoint(x: 2 * currentPoint.x - $0.x, y: 2 * currentPoint.y - $0.y)
        } ?? currentPoint
        let ap = command == "T" ? p : CGPoint(x: currentPoint.x + p.x, y: currentPoint.y + p.y)
        path.addQuadCurve(to: ap, controlPoint: reflected)
        currentPoint = ap
        lastControl = nil
        lastQuadControl = reflected

      case "A", "a":
        let rx = tokens.readNumber()
        let ry = tokens.readNumber()
        let xAxisRotation = tokens.readNumber() * .pi / 180
        let largeArc = tokens.readNumber() != 0
        let sweep = tokens.readNumber() != 0
        let end = tokens.readPoint()
        let absEnd = command == "A" ? end : CGPoint(x: currentPoint.x + end.x, y: currentPoint.y + end.y)
        ArcBuilder.addArc(
          to: path,
          from: currentPoint,
          to: absEnd,
          rx: rx,
          ry: ry,
          xAxisRotation: xAxisRotation,
          largeArc: largeArc,
          sweep: sweep
        )
        currentPoint = absEnd
        lastControl = nil
        lastQuadControl = nil

      case "Z", "z":
        path.close()
        currentPoint = subpathStart
        lastControl = nil
        lastQuadControl = nil

      default:
        tokens.consume()
      }
    }

    return path
  }
}

private struct Tokenizer {
  private let chars: [Character]
  private var index = 0

  init(_ s: String) { self.chars = Array(s) }

  mutating func peek() -> Character? {
    skipSeparators()
    return index < chars.count ? chars[index] : nil
  }

  mutating func consume() {
    if index < chars.count { index += 1 }
  }

  mutating func readNumber() -> CGFloat {
    skipSeparators()
    let start = index
    var sawDot = false
    var sawE = false
    while index < chars.count {
      let c = chars[index]
      if index == start && (c == "+" || c == "-") {
        index += 1
        continue
      }
      if c == "." {
        if sawDot || sawE { break }
        sawDot = true
        index += 1
        continue
      }
      if c == "e" || c == "E" {
        if sawE { break }
        sawE = true
        index += 1
        if index < chars.count && (chars[index] == "+" || chars[index] == "-") {
          index += 1
        }
        continue
      }
      if c.isNumber {
        index += 1
        continue
      }
      break
    }
    let slice = String(chars[start..<index])
    return CGFloat(Double(slice) ?? 0)
  }

  mutating func readPoint() -> CGPoint {
    let x = readNumber()
    let y = readNumber()
    return CGPoint(x: x, y: y)
  }

  private mutating func skipSeparators() {
    while index < chars.count {
      let c = chars[index]
      if c == " " || c == "," || c == "\t" || c == "\n" || c == "\r" {
        index += 1
      } else {
        break
      }
    }
  }
}

private enum ArcBuilder {
  /// Converts an SVG elliptical arc to a series of cubic Bezier segments and
  /// appends them to the given path. Based on the W3C "Elliptical Arc
  /// Implementation Notes" conversion.
  static func addArc(
    to path: UIBezierPath,
    from start: CGPoint,
    to end: CGPoint,
    rx rxIn: CGFloat,
    ry ryIn: CGFloat,
    xAxisRotation phi: CGFloat,
    largeArc: Bool,
    sweep: Bool
  ) {
    if start == end { return }
    if rxIn == 0 || ryIn == 0 {
      path.addLine(to: end)
      return
    }

    var rx = abs(rxIn)
    var ry = abs(ryIn)
    let cosPhi = cos(phi)
    let sinPhi = sin(phi)

    let dx = (start.x - end.x) / 2
    let dy = (start.y - end.y) / 2
    let x1p = cosPhi * dx + sinPhi * dy
    let y1p = -sinPhi * dx + cosPhi * dy

    let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if lambda > 1 {
      let s = sqrt(lambda)
      rx *= s
      ry *= s
    }

    let sign: CGFloat = (largeArc == sweep) ? -1 : 1
    let numerator = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    let denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    let factor = sign * sqrt(max(0, numerator / denominator))
    let cxp = factor * (rx * y1p / ry)
    let cyp = factor * (-ry * x1p / rx)

    let cx = cosPhi * cxp - sinPhi * cyp + (start.x + end.x) / 2
    let cy = sinPhi * cxp + cosPhi * cyp + (start.y + end.y) / 2

    let startVec = CGPoint(x: (x1p - cxp) / rx, y: (y1p - cyp) / ry)
    let endVec = CGPoint(x: (-x1p - cxp) / rx, y: (-y1p - cyp) / ry)
    let theta1 = angle(from: CGPoint(x: 1, y: 0), to: startVec)
    var deltaTheta = angle(from: startVec, to: endVec)
    if !sweep && deltaTheta > 0 {
      deltaTheta -= 2 * .pi
    } else if sweep && deltaTheta < 0 {
      deltaTheta += 2 * .pi
    }

    // Split into up to 4 cubic beziers (each covering <= 90°).
    let segments = max(1, Int(ceil(abs(deltaTheta) / (.pi / 2))))
    let delta = deltaTheta / CGFloat(segments)
    let t = (4.0 / 3.0) * tan(delta / 4)

    var theta = theta1
    for _ in 0..<segments {
      let cosT = cos(theta)
      let sinT = sin(theta)
      let cosT2 = cos(theta + delta)
      let sinT2 = sin(theta + delta)

      let p1 = CGPoint(x: cosT - t * sinT, y: sinT + t * cosT)
      let p2 = CGPoint(x: cosT2 + t * sinT2, y: sinT2 - t * cosT2)
      let p3 = CGPoint(x: cosT2, y: sinT2)

      let c1 = transformEllipsePoint(p1, rx: rx, ry: ry, phi: phi, cx: cx, cy: cy)
      let c2 = transformEllipsePoint(p2, rx: rx, ry: ry, phi: phi, cx: cx, cy: cy)
      let c3 = transformEllipsePoint(p3, rx: rx, ry: ry, phi: phi, cx: cx, cy: cy)

      path.addCurve(to: c3, controlPoint1: c1, controlPoint2: c2)
      theta += delta
    }
  }

  private static func transformEllipsePoint(_ p: CGPoint, rx: CGFloat, ry: CGFloat, phi: CGFloat, cx: CGFloat, cy: CGFloat) -> CGPoint {
    let x = rx * p.x
    let y = ry * p.y
    let rx_ = cos(phi) * x - sin(phi) * y + cx
    let ry_ = sin(phi) * x + cos(phi) * y + cy
    return CGPoint(x: rx_, y: ry_)
  }

  private static func angle(from u: CGPoint, to v: CGPoint) -> CGFloat {
    let dot = u.x * v.x + u.y * v.y
    let det = u.x * v.y - u.y * v.x
    return atan2(det, dot)
  }
}
