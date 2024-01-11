public class ExpoSelectableTextUtil {
  public static func hexToUIColor(hex: String?) -> UIColor {
    guard let hex else {
      return UIColor.black
    }

    let r, g, b, a: CGFloat

    if hex.hasPrefix("#") {
      let start = hex.index(hex.startIndex, offsetBy: 1)
      let hexColor = String(hex[start...])

      if hexColor.count == 8 {
        let scanner = Scanner(string: hexColor)
        var hexNumber: UInt64 = 0

        if scanner.scanHexInt64(&hexNumber) {
          r = CGFloat((hexNumber & 0xff000000) >> 24) / 255
          g = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
          b = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
          a = CGFloat(hexNumber & 0x000000ff) / 255

          return UIColor(red: r, green: g, blue: b, alpha: a)
        }
      } else if hexColor.count == 6 {
        let scanner = Scanner(string: hexColor)
        var hexNumber: UInt64 = 0

        if scanner.scanHexInt64(&hexNumber) {
          r = CGFloat((hexNumber & 0xff0000) >> 16) / 255
          g = CGFloat((hexNumber & 0x00ff00) >> 8) / 255
          b = CGFloat(hexNumber & 0x0000ff) / 255

          return UIColor(red: r, green: g, blue: b, alpha: 1.0)
        }
      }
    }

    return UIColor.black
  }
}

// https://github.com/WorldDownTown/CSS3ColorsSwift/blob/master/CSS3ColorsSwift/CSS3ColorsSwift.swift

//
//  CSS3Colors.swift
//  CSS3Colors
//
//  Created by Keisuke Shoji on 2016/11/07.
//  Copyright © 2016年 Keisuke Shoji. All rights reserved.
//

import UIKit

public extension UIColor {

    class var whiteSmoke:           UIColor { return #colorLiteral(red: 0.9607843137, green: 0.9607843137, blue: 0.9607843137, alpha: 1) }  // F5F5F5
    class var ghostWhite:           UIColor { return #colorLiteral(red: 0.9725490196, green: 0.9725490196, blue: 1.0000000000, alpha: 1) }  // F8F8FF
    class var aliceBlue:            UIColor { return #colorLiteral(red: 0.9411764706, green: 0.9725490196, blue: 1.0000000000, alpha: 1) }  // F0F8FF
    class var lavender:             UIColor { return #colorLiteral(red: 0.9019607843, green: 0.9019607843, blue: 0.9803921569, alpha: 1) }  // E6E6FA
    class var azure:                UIColor { return #colorLiteral(red: 0.9411764706, green: 1.0000000000, blue: 1.0000000000, alpha: 1) }  // F0FFFF
    class var lightCyan:            UIColor { return #colorLiteral(red: 0.8784313725, green: 1.0000000000, blue: 1.0000000000, alpha: 1) }  // E0FFFF
    class var mintCream:            UIColor { return #colorLiteral(red: 0.9607843137, green: 1.0000000000, blue: 0.9803921569, alpha: 1) }  // F5FFFA
    class var honeyDew:             UIColor { return #colorLiteral(red: 0.9411764706, green: 1.0000000000, blue: 0.9411764706, alpha: 1) }  // F0FFF0
    class var ivory:                UIColor { return #colorLiteral(red: 1.0000000000, green: 1.0000000000, blue: 0.9411764706, alpha: 1) }  // FFFFF0
    class var beige:                UIColor { return #colorLiteral(red: 0.9607843137, green: 0.9607843137, blue: 0.8627450980, alpha: 1) }  // F5F5DC
    class var lightYellow:          UIColor { return #colorLiteral(red: 1.0000000000, green: 1.0000000000, blue: 0.8784313725, alpha: 1) }  // FFFFE0
    class var lightGoldenRodYellow: UIColor { return #colorLiteral(red: 0.9803921569, green: 0.9803921569, blue: 0.8235294118, alpha: 1) }  // FAFAD2
    class var lemonChiffon:         UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9803921569, blue: 0.8039215686, alpha: 1) }  // FFFACD
    class var floralWhite:          UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9803921569, blue: 0.9411764706, alpha: 1) }  // FFFAF0
    class var oldLace:              UIColor { return #colorLiteral(red: 0.9921568627, green: 0.9607843137, blue: 0.9019607843, alpha: 1) }  // FDF5E6
    class var cornSilk:             UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9725490196, blue: 0.8627450980, alpha: 1) }  // FFF8DC
    class var papayaWhip:           UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9372549020, blue: 0.8352941176, alpha: 1) }  // FFEFD5
    class var blanchedAlmond:       UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9215686275, blue: 0.8039215686, alpha: 1) }  // FFEBCD
    class var bisque:               UIColor { return #colorLiteral(red: 1.0000000000, green: 0.8941176471, blue: 0.7686274510, alpha: 1) }  // FFE4C4
    class var snow:                 UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9803921569, blue: 0.9803921569, alpha: 1) }  // FFFAFA
    class var linen:                UIColor { return #colorLiteral(red: 0.9803921569, green: 0.9411764706, blue: 0.9019607843, alpha: 1) }  // FAF0E6
    class var antiqueWhite:         UIColor { return #colorLiteral(red: 0.9803921569, green: 0.9215686275, blue: 0.8431372549, alpha: 1) }  // FAEBD7
    class var seaShell:             UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9607843137, blue: 0.9333333333, alpha: 1) }  // FFF5EE
    class var lavenderBlush:        UIColor { return #colorLiteral(red: 1.0000000000, green: 0.9411764706, blue: 0.9607843137, alpha: 1) }  // FFF0F5
    class var mistyRose:            UIColor { return #colorLiteral(red: 1.0000000000, green: 0.8941176471, blue: 0.8823529412, alpha: 1) }  // FFE4E1
    class var gainsboro:            UIColor { return #colorLiteral(red: 0.8627450980, green: 0.8627450980, blue: 0.8627450980, alpha: 1) }  // DCDCDC
    class var lightGrayCSS3:        UIColor { return #colorLiteral(red: 0.8274509804, green: 0.8274509804, blue: 0.8274509804, alpha: 1) }  // D3D3D3
    class var lightSteelBlue:       UIColor { return #colorLiteral(red: 0.6901960784, green: 0.7686274510, blue: 0.8705882353, alpha: 1) }  // B0C4DE
    class var lightBlue:            UIColor { return #colorLiteral(red: 0.6784313725, green: 0.8470588235, blue: 0.9019607843, alpha: 1) }  // ADD8E6
    class var lightSkyBlue:         UIColor { return #colorLiteral(red: 0.5294117647, green: 0.8078431373, blue: 0.9803921569, alpha: 1) }  // 87CEFA
    class var powderBlue:           UIColor { return #colorLiteral(red: 0.6901960784, green: 0.8784313725, blue: 0.9019607843, alpha: 1) }  // B0E0E6
    class var paleTurquoise:        UIColor { return #colorLiteral(red: 0.6862745098, green: 0.9333333333, blue: 0.9333333333, alpha: 1) }  // AFEEEE
    class var skyBlue:              UIColor { return #colorLiteral(red: 0.5294117647, green: 0.8078431373, blue: 0.9215686275, alpha: 1) }  // 87CEEB
    class var mediumAquamarine:     UIColor { return #colorLiteral(red: 0.4000000000, green: 0.8039215686, blue: 0.6666666667, alpha: 1) }  // 66CDAA
    class var aquamarine:           UIColor { return #colorLiteral(red: 0.4980392157, green: 1.0000000000, blue: 0.8313725490, alpha: 1) }  // 7FFFD4
    class var paleGreen:            UIColor { return #colorLiteral(red: 0.5960784314, green: 0.9843137255, blue: 0.5960784314, alpha: 1) }  // 98FB98
    class var lightGreen:           UIColor { return #colorLiteral(red: 0.5647058824, green: 0.9333333333, blue: 0.5647058824, alpha: 1) }  // 90EE90
    class var khaki:                UIColor { return #colorLiteral(red: 0.9411764706, green: 0.9019607843, blue: 0.5490196078, alpha: 1) }  // F0E68C
    class var paleGoldenRod:        UIColor { return #colorLiteral(red: 0.9333333333, green: 0.9098039216, blue: 0.6666666667, alpha: 1) }  // EEE8AA
    class var moccasin:             UIColor { return #colorLiteral(red: 1.0000000000, green: 0.8941176471, blue: 0.7098039216, alpha: 1) }  // FFE4B5
    class var navajoWhite:          UIColor { return #colorLiteral(red: 1.0000000000, green: 0.8705882353, blue: 0.6784313725, alpha: 1) }  // FFDEAD
    class var peachPuff:            UIColor { return #colorLiteral(red: 1.0000000000, green: 0.8549019608, blue: 0.7254901961, alpha: 1) }  // FFDAB9
    class var wheat:                UIColor { return #colorLiteral(red: 0.9607843137, green: 0.8705882353, blue: 0.7019607843, alpha: 1) }  // F5DEB3
    class var pink:                 UIColor { return #colorLiteral(red: 1.0000000000, green: 0.7529411765, blue: 0.7960784314, alpha: 1) }  // FFC0CB
    class var lightPink:            UIColor { return #colorLiteral(red: 1.0000000000, green: 0.7137254902, blue: 0.7568627451, alpha: 1) }  // FFB6C1
    class var thistle:              UIColor { return #colorLiteral(red: 0.8470588235, green: 0.7490196078, blue: 0.8470588235, alpha: 1) }  // D8BFD8
    class var plum:                 UIColor { return #colorLiteral(red: 0.8666666667, green: 0.6274509804, blue: 0.8666666667, alpha: 1) }  // DDA0DD
    class var silver:               UIColor { return #colorLiteral(red: 0.7529411765, green: 0.7529411765, blue: 0.7529411765, alpha: 1) }  // C0C0C0
    class var darkGrayCSS3:         UIColor { return #colorLiteral(red: 0.6627450980, green: 0.6627450980, blue: 0.6627450980, alpha: 1) }  // A9A9A9
    class var lightSlateGray:       UIColor { return #colorLiteral(red: 0.4666666667, green: 0.5333333333, blue: 0.6000000000, alpha: 1) }  // 778899
    class var slateGray:            UIColor { return #colorLiteral(red: 0.4392156863, green: 0.5019607843, blue: 0.5647058824, alpha: 1) }  // 708090
    class var slateBlue:            UIColor { return #colorLiteral(red: 0.4156862745, green: 0.3529411765, blue: 0.8039215686, alpha: 1) }  // 6A5ACD
    class var steelBlue:            UIColor { return #colorLiteral(red: 0.2745098039, green: 0.5098039216, blue: 0.7058823529, alpha: 1) }  // 4682B4
    class var mediumSlateBlue:      UIColor { return #colorLiteral(red: 0.4823529412, green: 0.4078431373, blue: 0.9333333333, alpha: 1) }  // 7B68EE
    class var royalBlue:            UIColor { return #colorLiteral(red: 0.2549019608, green: 0.4117647059, blue: 0.8823529412, alpha: 1) }  // 4169E1
    class var dodgerBlue:           UIColor { return #colorLiteral(red: 0.1176470588, green: 0.5647058824, blue: 1.0000000000, alpha: 1) }  // 1E90FF
    class var cornflowerBlue:       UIColor { return #colorLiteral(red: 0.3921568627, green: 0.5843137255, blue: 0.9294117647, alpha: 1) }  // 6495ED
    class var deepSkyBlue:          UIColor { return #colorLiteral(red: 0.0000000000, green: 0.7490196078, blue: 1.0000000000, alpha: 1) }  // 00BFFF
    class var aqua:                 UIColor { return #colorLiteral(red: 0.0000000000, green: 1.0000000000, blue: 1.0000000000, alpha: 1) }  // 00FFFF
    class var turquoise:            UIColor { return #colorLiteral(red: 0.2509803922, green: 0.8784313725, blue: 0.8156862745, alpha: 1) }  // 40E0D0
    class var mediumTurquoise:      UIColor { return #colorLiteral(red: 0.2823529412, green: 0.8196078431, blue: 0.8000000000, alpha: 1) }  // 48D1CC
    class var darkTurquoise:        UIColor { return #colorLiteral(red: 0.0000000000, green: 0.8078431373, blue: 0.8196078431, alpha: 1) }  // 00CED1
    class var lightSeaGreen:        UIColor { return #colorLiteral(red: 0.1254901961, green: 0.6980392157, blue: 0.6666666667, alpha: 1) }  // 20B2AA
    class var mediumSpringGreen:    UIColor { return #colorLiteral(red: 0.0000000000, green: 0.9803921569, blue: 0.6039215686, alpha: 1) }  // 00FA9A
    class var springGreen:          UIColor { return #colorLiteral(red: 0.0000000000, green: 1.0000000000, blue: 0.4980392157, alpha: 1) }  // 00FF7F
    class var lime:                 UIColor { return #colorLiteral(red: 0.0000000000, green: 1.0000000000, blue: 0.0000000000, alpha: 1) }  // 00FF00
    class var limeGreen:            UIColor { return #colorLiteral(red: 0.1960784314, green: 0.8039215686, blue: 0.1960784314, alpha: 1) }  // 32CD32
    class var yellowGreen:          UIColor { return #colorLiteral(red: 0.6039215686, green: 0.8039215686, blue: 0.1960784314, alpha: 1) }  // 9ACD32
    class var lawnGreen:            UIColor { return #colorLiteral(red: 0.4862745098, green: 0.9882352941, blue: 0.0000000000, alpha: 1) }  // 7CFC00
    class var chartreuse:           UIColor { return #colorLiteral(red: 0.4980392157, green: 1.0000000000, blue: 0.0000000000, alpha: 1) }  // 7FFF00
    class var greenYellow:          UIColor { return #colorLiteral(red: 0.6784313725, green: 1.0000000000, blue: 0.1843137255, alpha: 1) }  // ADFF2F
    class var gold:                 UIColor { return #colorLiteral(red: 1.0000000000, green: 0.8431372549, blue: 0.0000000000, alpha: 1) }  // FFD700
    class var orangeCSS3:           UIColor { return #colorLiteral(red: 1.0000000000, green: 0.6470588235, blue: 0.0000000000, alpha: 1) }  // FFA500
    class var darkOrange:           UIColor { return #colorLiteral(red: 1.0000000000, green: 0.5490196078, blue: 0.0000000000, alpha: 1) }  // FF8C00
    class var goldenRod:            UIColor { return #colorLiteral(red: 0.8549019608, green: 0.6470588235, blue: 0.1254901961, alpha: 1) }  // DAA520
    class var burlyWood:            UIColor { return #colorLiteral(red: 0.8705882353, green: 0.7215686275, blue: 0.5294117647, alpha: 1) }  // DEB887
    class var tan:                  UIColor { return #colorLiteral(red: 0.8235294118, green: 0.7058823529, blue: 0.5490196078, alpha: 1) }  // D2B48C
    class var sandyBrown:           UIColor { return #colorLiteral(red: 0.9568627451, green: 0.6431372549, blue: 0.3764705882, alpha: 1) }  // F4A460
    class var darkSalmon:           UIColor { return #colorLiteral(red: 0.9137254902, green: 0.5882352941, blue: 0.4784313725, alpha: 1) }  // E9967A
    class var lightCoral:           UIColor { return #colorLiteral(red: 0.9411764706, green: 0.5019607843, blue: 0.5019607843, alpha: 1) }  // F08080
    class var salmon:               UIColor { return #colorLiteral(red: 0.9803921569, green: 0.5019607843, blue: 0.4470588235, alpha: 1) }  // FA8072
    class var lightSalmon:          UIColor { return #colorLiteral(red: 1.0000000000, green: 0.6274509804, blue: 0.4784313725, alpha: 1) }  // FFA07A
    class var coral:                UIColor { return #colorLiteral(red: 1.0000000000, green: 0.4980392157, blue: 0.3137254902, alpha: 1) }  // FF7F50
    class var tomato:               UIColor { return #colorLiteral(red: 1.0000000000, green: 0.3882352941, blue: 0.2784313725, alpha: 1) }  // FF6347
    class var orangeRed:            UIColor { return #colorLiteral(red: 1.0000000000, green: 0.2705882353, blue: 0.0000000000, alpha: 1) }  // FF4500
    class var deepPink:             UIColor { return #colorLiteral(red: 1.0000000000, green: 0.0784313725, blue: 0.5764705882, alpha: 1) }  // FF1493
    class var hotPink:              UIColor { return #colorLiteral(red: 1.0000000000, green: 0.4117647059, blue: 0.7058823529, alpha: 1) }  // FF69B4
    class var paleVioletRed:        UIColor { return #colorLiteral(red: 0.8470588235, green: 0.4392156863, blue: 0.5764705882, alpha: 1) }  // D87093
    class var violet:               UIColor { return #colorLiteral(red: 0.9333333333, green: 0.5098039216, blue: 0.9333333333, alpha: 1) }  // EE82EE
    class var orchid:               UIColor { return #colorLiteral(red: 0.8549019608, green: 0.4392156863, blue: 0.8392156863, alpha: 1) }  // DA70D6
    class var fuchsia:              UIColor { return #colorLiteral(red: 1.0000000000, green: 0.0000000000, blue: 1.0000000000, alpha: 1) }  // FF00FF
    class var mediumOrchid:         UIColor { return #colorLiteral(red: 0.7294117647, green: 0.3333333333, blue: 0.8274509804, alpha: 1) }  // BA55D3
    class var darkOrchid:           UIColor { return #colorLiteral(red: 0.6000000000, green: 0.1960784314, blue: 0.8000000000, alpha: 1) }  // 9932CC
    class var darkViolet:           UIColor { return #colorLiteral(red: 0.5803921569, green: 0.0000000000, blue: 0.8274509804, alpha: 1) }  // 9400D3
    class var blueViolet:           UIColor { return #colorLiteral(red: 0.5411764706, green: 0.1686274510, blue: 0.8862745098, alpha: 1) }  // 8A2BE2
    class var mediumPurple:         UIColor { return #colorLiteral(red: 0.5764705882, green: 0.4392156863, blue: 0.8470588235, alpha: 1) }  // 9370D8
    class var mediumBlue:           UIColor { return #colorLiteral(red: 0.0000000000, green: 0.0000000000, blue: 0.8039215686, alpha: 1) }  // 0000CD
    class var darkCyan:             UIColor { return #colorLiteral(red: 0.0000000000, green: 0.5450980392, blue: 0.5450980392, alpha: 1) }  // 008B8B
    class var cadetBlue:            UIColor { return #colorLiteral(red: 0.3725490196, green: 0.6196078431, blue: 0.6274509804, alpha: 1) }  // 5F9EA0
    class var darkSeaGreen:         UIColor { return #colorLiteral(red: 0.5607843137, green: 0.7372549020, blue: 0.5607843137, alpha: 1) }  // 8FBC8F
    class var mediumSeaGreen:       UIColor { return #colorLiteral(red: 0.2352941176, green: 0.7019607843, blue: 0.4431372549, alpha: 1) }  // 3CB371
    class var teal:                 UIColor { return #colorLiteral(red: 0.0000000000, green: 0.5019607843, blue: 0.5019607843, alpha: 1) }  // 008080
    class var forestGreen:          UIColor { return #colorLiteral(red: 0.1333333333, green: 0.5450980392, blue: 0.1333333333, alpha: 1) }  // 228B22
    class var seaGreen:             UIColor { return #colorLiteral(red: 0.1803921569, green: 0.5450980392, blue: 0.3411764706, alpha: 1) }  // 2E8B57
    class var darkKhaki:            UIColor { return #colorLiteral(red: 0.7411764706, green: 0.7176470588, blue: 0.4196078431, alpha: 1) }  // BDB76B
    class var peru:                 UIColor { return #colorLiteral(red: 0.8039215686, green: 0.5215686275, blue: 0.2470588235, alpha: 1) }  // CD853F
    class var crimson:              UIColor { return #colorLiteral(red: 0.8627450980, green: 0.0784313725, blue: 0.2352941176, alpha: 1) }  // DC143C
    class var indianRed:            UIColor { return #colorLiteral(red: 0.8039215686, green: 0.3607843137, blue: 0.3607843137, alpha: 1) }  // CD5C5C
    class var rosyBrown:            UIColor { return #colorLiteral(red: 0.7372549020, green: 0.5607843137, blue: 0.5607843137, alpha: 1) }  // BC8F8F
    class var mediumVioletRed:      UIColor { return #colorLiteral(red: 0.7803921569, green: 0.0823529412, blue: 0.5215686275, alpha: 1) }  // C71585
    class var dimGray:              UIColor { return #colorLiteral(red: 0.4117647059, green: 0.4117647059, blue: 0.4117647059, alpha: 1) }  // 696969
    class var midnightBlue:         UIColor { return #colorLiteral(red: 0.0980392157, green: 0.0980392157, blue: 0.4392156863, alpha: 1) }  // 191970
    class var darkSlateBlue:        UIColor { return #colorLiteral(red: 0.2823529412, green: 0.2392156863, blue: 0.5450980392, alpha: 1) }  // 483D8B
    class var darkBlue:             UIColor { return #colorLiteral(red: 0.0000000000, green: 0.0000000000, blue: 0.5450980392, alpha: 1) }  // 00008B
    class var navy:                 UIColor { return #colorLiteral(red: 0.0000000000, green: 0.0000000000, blue: 0.5019607843, alpha: 1) }  // 000080
    class var darkSlateGray:        UIColor { return #colorLiteral(red: 0.1843137255, green: 0.3098039216, blue: 0.3098039216, alpha: 1) }  // 2F4F4F
    class var greenCSS3:            UIColor { return #colorLiteral(red: 0.0000000000, green: 0.5019607843, blue: 0.0000000000, alpha: 1) }  // 008000
    class var darkGreen:            UIColor { return #colorLiteral(red: 0.0000000000, green: 0.3921568627, blue: 0.0000000000, alpha: 1) }  // 006400
    class var darkOliveGreen:       UIColor { return #colorLiteral(red: 0.3333333333, green: 0.4196078431, blue: 0.1843137255, alpha: 1) }  // 556B2F
    class var oliveDrab:            UIColor { return #colorLiteral(red: 0.4196078431, green: 0.5568627451, blue: 0.1372549020, alpha: 1) }  // 6B8E23
    class var olive:                UIColor { return #colorLiteral(red: 0.5019607843, green: 0.5019607843, blue: 0.0000000000, alpha: 1) }  // 808000
    class var darkGoldenRod:        UIColor { return #colorLiteral(red: 0.7215686275, green: 0.5254901961, blue: 0.0431372549, alpha: 1) }  // B8860B
    class var chocolate:            UIColor { return #colorLiteral(red: 0.8235294118, green: 0.4117647059, blue: 0.1176470588, alpha: 1) }  // D2691E
    class var sienna:               UIColor { return #colorLiteral(red: 0.6274509804, green: 0.3215686275, blue: 0.1764705882, alpha: 1) }  // A0522D
    class var saddleBrown:          UIColor { return #colorLiteral(red: 0.5450980392, green: 0.2705882353, blue: 0.0745098039, alpha: 1) }  // 8B4513
    class var fireBrick:            UIColor { return #colorLiteral(red: 0.6980392157, green: 0.1333333333, blue: 0.1333333333, alpha: 1) }  // B22222
    class var brownCSS3:            UIColor { return #colorLiteral(red: 0.6470588235, green: 0.1647058824, blue: 0.1647058824, alpha: 1) }  // A52A2A
    class var maroon:               UIColor { return #colorLiteral(red: 0.5019607843, green: 0.0000000000, blue: 0.0000000000, alpha: 1) }  // 800000
    class var darkRed:              UIColor { return #colorLiteral(red: 0.5450980392, green: 0.0000000000, blue: 0.0000000000, alpha: 1) }  // 8B0000
    class var darkMagenta:          UIColor { return #colorLiteral(red: 0.5450980392, green: 0.0000000000, blue: 0.5450980392, alpha: 1) }  // 8B008B
    class var indigo:               UIColor { return #colorLiteral(red: 0.2941176471, green: 0.0000000000, blue: 0.5098039216, alpha: 1) }  // 4B0082
}
