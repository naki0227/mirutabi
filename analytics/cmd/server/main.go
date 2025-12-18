package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/naki0227/mirutabi/analytics/internal/handler"
	"github.com/naki0227/mirutabi/analytics/internal/storage"
)

func main() {
	// Load env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize Storage
	store, err := storage.NewFirestoreStore()
	if err != nil {
		log.Printf("Warning: Failed to connect to Firestore: %v. Check GOOGLE_APPLICATION_CREDENTIALS.", err)
	} else {
		defer store.Close()
	}

	// Initialize Handler
	logHandler := handler.NewLogHandler(store)

	// Initialize Router
	r := gin.Default()

	// CORS Setup
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://mirutabi.com", "https://tabista.vercel.app"}, // Adjust as needed
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		status := "ok"
		if store == nil {
			status = "db_down"
		}
		c.JSON(200, gin.H{
			"status": status,
		})
	})

	// Log Endpoint
	r.POST("/log", logHandler.HandleLog)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Analytics server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
