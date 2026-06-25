package main

import (
	"archive/zip"
	"bytes"
	"crypto/rsa"
	"crypto/sha1"
	"crypto/x509"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"

	"go.mozilla.org/pkcs7"
)

type PassAsset struct {
	Name string
	Data []byte
}

type PassSigner struct {
	Cert *x509.Certificate
	Key  *rsa.PrivateKey
	WWDR *x509.Certificate
}

func LoadPassSigner(certPEM, keyPEM, wwdrPEM []byte) (*PassSigner, error) {
	cert, err := decodeCert(certPEM)
	if err != nil {
		return nil, fmt.Errorf("cert: %w", err)
	}
	key, err := decodeKey(keyPEM)
	if err != nil {
		return nil, fmt.Errorf("key: %w", err)
	}
	wwdr, err := decodeCert(wwdrPEM)
	if err != nil {
		return nil, fmt.Errorf("wwdr: %w", err)
	}
	return &PassSigner{Cert: cert, Key: key, WWDR: wwdr}, nil
}

func decodeCert(data []byte) (*x509.Certificate, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("no PEM block")
	}
	return x509.ParseCertificate(block.Bytes)
}

func decodeKey(data []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("no PEM block")
	}
	if k, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return k, nil
	}
	k, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	rsaKey, ok := k.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("not an RSA key")
	}
	return rsaKey, nil
}

func SignAndZipPass(passJSON []byte, assets []PassAsset, signer *PassSigner) ([]byte, error) {
	manifest := map[string]string{
		"pass.json": sha1Hex(passJSON),
	}
	for _, a := range assets {
		manifest[a.Name] = sha1Hex(a.Data)
	}
	manifestJSON, err := json.Marshal(manifest)
	if err != nil {
		return nil, err
	}

	sig, err := signManifest(manifestJSON, signer)
	if err != nil {
		return nil, fmt.Errorf("sign manifest: %w", err)
	}

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	if err := writeZipEntry(zw, "pass.json", passJSON); err != nil {
		return nil, err
	}
	if err := writeZipEntry(zw, "manifest.json", manifestJSON); err != nil {
		return nil, err
	}
	if err := writeZipEntry(zw, "signature", sig); err != nil {
		return nil, err
	}
	for _, a := range assets {
		if err := writeZipEntry(zw, a.Name, a.Data); err != nil {
			return nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writeZipEntry(zw *zip.Writer, name string, data []byte) error {
	w, err := zw.Create(name)
	if err != nil {
		return err
	}
	_, err = w.Write(data)
	return err
}

func sha1Hex(b []byte) string {
	sum := sha1.Sum(b)
	return hex.EncodeToString(sum[:])
}

func signManifest(manifest []byte, signer *PassSigner) ([]byte, error) {
	signedData, err := pkcs7.NewSignedData(manifest)
	if err != nil {
		return nil, err
	}
	signedData.AddCertificate(signer.WWDR)
	if err := signedData.AddSigner(signer.Cert, signer.Key, pkcs7.SignerInfoConfig{}); err != nil {
		return nil, err
	}
	signedData.Detach()
	return signedData.Finish()
}
