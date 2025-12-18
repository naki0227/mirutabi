# Build Stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
# Since go.sum might not exist yet if 'go mod tidy' hasn't been run locally, we handle it gracefully
# In a real CI, go.sum should exist. Here we allow it to be missing or generated.
RUN go mod download || true

COPY . .
RUN go build -o server ./cmd/server

# Run Stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
