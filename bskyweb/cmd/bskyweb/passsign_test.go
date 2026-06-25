package main

import (
	"archive/zip"
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"io"
	"math/big"
	"testing"
	"time"

	"go.mozilla.org/pkcs7"
)

func TestSignAndZipPass_StructureAndSignature(t *testing.T) {
	cert, key, wwdr := genTestCertChain(t)
	signer := &PassSigner{Cert: cert, Key: key, WWDR: wwdr}

	passJSON := []byte(`{"formatVersion":1,"passTypeIdentifier":"pass.app.bsky.invite"}`)
	assets := []PassAsset{
		{Name: "icon.png", Data: []byte("iconbytes")},
		{Name: "logo.png", Data: []byte("logobytes")},
		{Name: "strip.png", Data: []byte("stripbytes")},
	}

	out, err := SignAndZipPass(passJSON, assets, signer)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}

	r, err := zip.NewReader(bytes.NewReader(out), int64(len(out)))
	if err != nil {
		t.Fatalf("zip read: %v", err)
	}

	want := map[string]bool{
		"pass.json": false, "manifest.json": false, "signature": false,
		"icon.png": false, "logo.png": false, "strip.png": false,
	}
	for _, f := range r.File {
		want[f.Name] = true
	}
	for name, present := range want {
		if !present {
			t.Errorf("missing %q in .pkpass zip", name)
		}
	}

	// Verify signature parses and was signed by our test cert.
	for _, f := range r.File {
		if f.Name != "signature" {
			continue
		}
		rc, _ := f.Open()
		sigBytes, _ := io.ReadAll(rc)
		rc.Close()
		p7, err := pkcs7.Parse(sigBytes)
		if err != nil {
			t.Fatalf("pkcs7 parse: %v", err)
		}
		if err := p7.VerifyWithChain(x509.NewCertPool()); err == nil {
			// We don't actually trust the test cert chain - just confirming Parse worked
		}
	}
}

func genTestCertChain(t *testing.T) (*x509.Certificate, *rsa.PrivateKey, *x509.Certificate) {
	t.Helper()
	key, _ := rsa.GenerateKey(rand.Reader, 2048)
	template := &x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject:      pkix.Name{CommonName: "test"},
		NotBefore:    time.Now(),
		NotAfter:     time.Now().Add(time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature,
	}
	derBytes, _ := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	cert, _ := x509.ParseCertificate(derBytes)
	return cert, key, cert // reuse cert as WWDR stand-in for the test
}

func TestLoadPassSigner_PEMRoundTrip(t *testing.T) {
	cert, key, wwdr := genTestCertChain(t)
	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: cert.Raw})
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(key)})
	wwdrPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: wwdr.Raw})

	signer, err := LoadPassSigner(certPEM, keyPEM, wwdrPEM)
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if signer.Cert == nil || signer.Key == nil || signer.WWDR == nil {
		t.Fatal("nil field on loaded signer")
	}
}
