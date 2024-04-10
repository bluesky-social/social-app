struct JWK {
  let kty: String
  let use: String
  let crv: String
  let kid: String
  let x: String
  let y: String
  var d: String?
  let alg: String
  
  func toJson() -> String {
    var dict: [String: Any] = [
      "kty": kty,
      "use": use,
      "crv": crv,
      "kid": kid,
      "x": x,
      "y": y,
      "alg": alg,
    ]
    
    if let d = d {
      dict["d"] = d
    }
    
    let jsonData = try! JSONSerialization.data(withJSONObject: dict, options: [])
    return String(data: jsonData, encoding: .utf8)!
  }
}
