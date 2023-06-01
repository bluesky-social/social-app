package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Mailmodo struct {
	httpClient *http.Client
	APIKey     string
	BaseURL    string
	ListName   string
}

func NewMailmodo(apiKey, listName string) *Mailmodo {
	return &Mailmodo{
		APIKey:     apiKey,
		BaseURL:    "https://api.mailmodo.com/api/v1",
		httpClient: &http.Client{},
		ListName:   listName,
	}
}

func (m *Mailmodo) request(ctx context.Context, httpMethod string, apiMethod string, data any) error {
	endpoint := fmt.Sprintf("%s/%s", m.BaseURL, apiMethod)
	js, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("Mailmodo JSON encoding failed: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, httpMethod, endpoint, bytes.NewBuffer(js))
	if err != nil {
		return fmt.Errorf("Mailmodo HTTP creating request %s %s failed: %w", httpMethod, apiMethod, err)
	}
	req.Header.Set("mmApiKey", m.APIKey)
	req.Header.Set("Content-Type", "application/json")

	res, err := m.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("Mailmodo HTTP making request %s %s failed: %w", httpMethod, apiMethod, err)
	}
	defer res.Body.Close()

	status := struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}{}
	if err := json.NewDecoder(res.Body).Decode(&status); err != nil {
		return fmt.Errorf("Mailmodo HTTP parsing response %s %s failed: %w", httpMethod, apiMethod, err)
	}
	if !status.Success {
		return fmt.Errorf("Mailmodo API response %s %s failed: %s", httpMethod, apiMethod, status.Message)
	}
	return nil
}

func (m *Mailmodo) AddToList(ctx context.Context, email string) error {
	return m.request(ctx, "POST", "addToList", map[string]any{
		"listName": m.ListName,
		"email":    email,
		"data": map[string]any{
			"email_hashed": fmt.Sprintf("%x", sha256.Sum256([]byte(email))),
		},
		"created_at": time.Now().UTC().Format(time.RFC3339),
	})
}
