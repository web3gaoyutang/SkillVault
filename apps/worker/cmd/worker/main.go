package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-redis/redis/v8"

	"github.com/skillvault/worker/internal/scanner"
)

type ScanTask struct {
	VersionID    uint64 `json:"version_id"`
	ArtifactPath string `json:"artifact_path"`
	CreatedAt    string `json:"created_at"`
}

func main() {
	log.Println("SkillVault Scan Worker starting...")

	redisAddr := envOrDefault("REDIS_ADDR", "127.0.0.1:6379")
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("failed to connect to Redis: %v", err)
	}

	s := scanner.NewScanner()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigCh
		log.Println("shutting down...")
		cancel()
	}()

	log.Println("waiting for scan tasks on queue:scan...")
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		result, err := rdb.BRPopLPush(ctx, "queue:scan", "queue:scan:processing", 5*time.Second).Result()
		if err != nil {
			if err == redis.Nil {
				continue
			}
			log.Printf("error polling queue: %v", err)
			continue
		}

		var task ScanTask
		if err := json.Unmarshal([]byte(result), &task); err != nil {
			log.Printf("invalid task payload: %v", err)
			rdb.LRem(ctx, "queue:scan:processing", 1, result)
			continue
		}

		log.Printf("processing scan task for version %d", task.VersionID)
		findings := s.Scan(ctx, task.ArtifactPath)
		log.Printf("scan complete for version %d: %d findings", task.VersionID, len(findings))

		// TODO: write findings to scan_results table

		rdb.LRem(ctx, "queue:scan:processing", 1, result)
	}
}

func envOrDefault(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
