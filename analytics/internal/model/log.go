package model

import "time"

type LogEntry struct {
	UserID    string            `json:"user_id"`
	EventType string            `json:"event_type" binding:"required"`
	Path      string            `json:"path"`
	Meta      map[string]string `json:"meta"`
	Timestamp time.Time         `json:"timestamp"`
}
