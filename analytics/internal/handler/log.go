package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/naki0227/mirutabi/analytics/internal/model"
	"github.com/naki0227/mirutabi/analytics/internal/storage"
)

type LogHandler struct {
	store *storage.FirestoreStore
}

func NewLogHandler(store *storage.FirestoreStore) *LogHandler {
	return &LogHandler{store: store}
}

func (h *LogHandler) HandleLog(c *gin.Context) {
	var entry model.LogEntry

	// Bind JSON
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set timestamp if missing
	if entry.Timestamp.IsZero() {
		entry.Timestamp = time.Now()
	}

	// Save to database
	if err := h.store.SaveLog(entry); err != nil {
		log.Printf("Failed to save log: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save log"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "captured"})
}
