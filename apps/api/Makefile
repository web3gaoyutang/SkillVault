.PHONY: build run wire clean

build:
	go build -o ../../bin/api ./cmd/server/

run:
	go run ./cmd/server/ -conf ./configs

wire:
	cd cmd/server && wire

clean:
	rm -f ../../bin/api
