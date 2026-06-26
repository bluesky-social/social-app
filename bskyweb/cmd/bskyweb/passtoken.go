// bskyweb/cmd/bskyweb/passtoken.go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var (
	ErrTokenExpired = errors.New("invite pass token expired")
	ErrTokenInvalid = errors.New("invite pass token invalid")
)

type passTokenPayload struct {
	Did   string `json:"d"`
	Theme string `json:"t"`
	PDS   string `json:"p,omitempty"`
	Exp   int64  `json:"e"`
}

func MintPassToken(secret []byte, did, theme, pdsHost string, now time.Time, ttl time.Duration) (string, error) {
	p := passTokenPayload{Did: did, Theme: theme, PDS: pdsHost, Exp: now.Add(ttl).Unix()}
	body, err := json.Marshal(p)
	if err != nil {
		return "", err
	}
	bodyB64 := base64.RawURLEncoding.EncodeToString(body)
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(bodyB64))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return bodyB64 + "." + sig, nil
}

func VerifyPassToken(secret []byte, token string, now time.Time) (did, theme, pdsHost string, err error) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", "", "", ErrTokenInvalid
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(parts[0]))
	want := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(want), []byte(parts[1])) {
		return "", "", "", ErrTokenInvalid
	}
	body, perr := base64.RawURLEncoding.DecodeString(parts[0])
	if perr != nil {
		return "", "", "", ErrTokenInvalid
	}
	var p passTokenPayload
	if uerr := json.Unmarshal(body, &p); uerr != nil {
		return "", "", "", ErrTokenInvalid
	}
	if now.Unix() > p.Exp {
		return "", "", "", ErrTokenExpired
	}
	return p.Did, p.Theme, p.PDS, nil
}
