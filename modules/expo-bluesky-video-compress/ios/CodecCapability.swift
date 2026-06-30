import VideoToolbox

enum CodecCapability {
  static let isHardwareHEVCEncodeAvailable: Bool = {
    var encoderListCF: CFArray?
    let status = VTCopyVideoEncoderList(nil, &encoderListCF)
    guard status == noErr, let encoderList = encoderListCF as? [[String: Any]] else {
      return false
    }
    return encoderList.contains { encoder in
      guard let codecTypeValue = encoder[kVTVideoEncoderList_CodecType as String] as? Int,
            codecTypeValue == Int(kCMVideoCodecType_HEVC) else {
        return false
      }
      if let isHardware = encoder[kVTVideoEncoderList_IsHardwareAccelerated as String] as? Bool {
        return isHardware
      }
      return true
    }
  }()
}
