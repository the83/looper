SHELL:=/usr/bin/env bash

.PHONY: run build compile-songs test electron dist

run:
	make compile-songs
	yarn start

build:
	make compile-songs
	yarn build

compile-songs:
	yaml2json src/songs --pretty --save --recursive

test:
	yarn test

electron:
	make compile-songs
	yarn build
	yarn start-electron

dist:
	# make compile-songs
	# yarn build
	cp ./main.js ./build/electron.js
	yarn dist
