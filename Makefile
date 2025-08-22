SHELL = /bin/bash
.SHELLFLAGS = -o pipefail -c

.PHONY: help
help: ## Print info about all commands
	@echo "Commands:"
	@echo
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[01;32m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: build-web
build-web: ## Compile web bundle, copy to gndrweb directory
	yarn intl:build
	yarn build-web

.PHONY: build-web-embed
build-web-embed: ## Compile web embed bundle, copy to gndrweb/embedr* directories
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
	yarn install --frozen-lockfile --recursive
	cd gndrembed && yarn install --frozen-lockfile --recursive

.PHONY: deps-switch-upstream-gander
deps-switch-upstream-gander: ## Switch upstream for all dependencies to the latest version
	# The scripts swap the upstream to the gander version of the api
	node scripts/switch-upstream.js gander
	# Remove all node_modules and yarn.lock and build files to ensure a clean install
	rm -rf node_modules yarn.lock ios android web-build
	# Install dependencies for the main project
	yarn install --no-frozen-lockfile --recursive
	# Install dependencies for the gndrembed project
	cd gndrembed && rm -rf node_modules yarn.lock && yarn install --no-frozen-lockfile --recursive
	# Run linting to ensure code quality
	rm -f .eslintcache
	yarn run lint --fix

.PHONY: deps-switch-upstream-atproto
deps-switch-upstream-atproto: ## Switch upstream for all dependencies to the latest version
	# The scripts swap the upstream to the atproto version of the api
	node scripts/switch-upstream.js atproto
	# Remove all node_modules and yarn.lock and build files to ensure a clean install
	rm -rf node_modules yarn.lock ios android web-build

	# Install dependencies for the main project
	yarn install --no-frozen-lockfile --recursive
	# Install dependencies for the gndrembed project
	cd gndrembed && rm -rf node_modules yarn.lock && yarn install --no-frozen-lockfile --recursive
	# Run linting to ensure code quality
	rm -f .eslintcache
	yarn run lint --fix

.PHONY: nvm-setup
nvm-setup: ## Use NVM to install and activate node+yarn
	nvm install 20
	nvm use 20
	npm install --global yarn
