.PHONY: dev migrate build clean docker-up docker-down lint test

# Start infrastructure (MySQL, Redis, MinIO)
docker-up:
	docker compose -f deploy/docker-compose/docker-compose.yaml up -d

docker-down:
	docker compose -f deploy/docker-compose/docker-compose.yaml down

# Run database migrations
migrate:
	docker exec -i skillvault-mysql mysql -uroot -prootpassword skillvault < deploy/docker-compose/init.sql

# Start all dev services
dev:
	@echo "Starting API..."
	cd apps/api && go run ./cmd/server/ &
	@echo "Starting Worker..."
	cd apps/worker && go run ./cmd/worker/ &
	@echo "Starting Web..."
	cd apps/web && npm run dev &

# Build all Go binaries
build:
	cd apps/api && go build -o ../../bin/api ./cmd/server/
	cd apps/worker && go build -o ../../bin/worker ./cmd/worker/
	cd cli/skillvault && go build -o ../../bin/skillvault .

# Run tests
test:
	cd apps/api && go test ./...
	cd apps/worker && go test ./...
	cd cli/skillvault && go test ./...

# Clean build artifacts
clean:
	rm -rf bin/ dist/
	cd apps/web && rm -rf dist/ node_modules/
