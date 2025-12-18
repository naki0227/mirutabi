package storage

import (
	"context"
	"fmt"
	"log"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"github.com/naki0227/mirutabi/analytics/internal/model"
	"google.golang.org/api/option"
)

type FirestoreStore struct {
	client *firestore.Client
}

func NewFirestoreStore() (*FirestoreStore, error) {
	ctx := context.Background()

	// Initialize Firebase App
	// It automatically looks for GOOGLE_APPLICATION_CREDENTIALS
    // or we can pass option.WithCredentialsFile("service-account.json") if explicitly needed
	// For flexibility, we rely on the env var or default config
    var conf *firebase.Config
    var opts []option.ClientOption
    
    // Check if we want to use specific file from env manually or rely on SDK
    // SDK default behavior is best.
    
	app, err := firebase.NewApp(ctx, conf, opts...)
	if err != nil {
		return nil, fmt.Errorf("error initializing firebase app: %v", err)
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting firestore client: %v", err)
	}

	return &FirestoreStore{client: client}, nil
}

func (s *FirestoreStore) SaveLog(entry model.LogEntry) error {
	ctx := context.Background()
	
	// Collection: event_logs
	_, _, err := s.client.Collection("event_logs").Add(ctx, entry)
	if err != nil {
		log.Printf("Failed to add to firestore: %v", err)
        return err
	}
	
	return nil
}

func (s *FirestoreStore) Close() {
    s.client.Close()
}
