
SHELL = /bin/bash
.SHELLFLAGS = -o pipefail -c

.PHONY: help
help: ## Print info about all commands
	@echo "Commands:"
	@echo
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[01;32m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: build-web
build-web: ## Compile web bundle, copy to bskyweb directory
	yarn intl:build
	yarn build-web

.PHONY: build-web-embed
build-web-embed: ## Compile web embed bundle, copy to bskyweb/embedr* directories
	yarn intl:build
	yarn build-embed

.PHONY: test
test: ## Run all tests
	NODE_ENV=test yarn test

.PHONY: lint
lint: ## Run style checks and verify syntax
	yarn run lint

#.PHONY: fmt
#fmt: ## Run syntax re-formatting
#	yarn prettier

.PHONY: deps
deps: ## Installs dependent libs using 'yarn install'
	yarn install --frozen-lockfile
	cd bskyembed && yarn install --frozen-lockfile

.PHONY: nvm-setup
nvm-setup: ## Use NVM to install and activate node+yarn
	nvm install 18
	nvm use 18
	npm install --global yarn
