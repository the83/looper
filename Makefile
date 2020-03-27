SHELL:=/usr/bin/env bash

.PHONY: run
run:
	make compile-songs
	yarn start

.PHONY: build
build:
	make compile-songs
	yarn build

.PHONY: compile-songs
compile-songs:
	yaml2json src/songs --pretty --save --recursive

.PHONY: test
test:
	yarn test
