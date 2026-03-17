FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o /api ./cmd/server/

FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /api .
COPY configs/ /app/configs/
EXPOSE 8080 9090
CMD ["./api", "-conf", "/app/configs"]
