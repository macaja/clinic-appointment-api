.PHONY: help local-setup local-run local-create-appointment \
        local-clinician-get-appointments local-admin-get-appointments \
        lint format typecheck test test-integration build review \
        local-race-condition-test local-clean-db

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-36s\033[0m %s\n", $$1, $$2}'

local-setup: ## Install dependencies
	npm ci

local-run: ## Start the API server (watches for changes)
	npm run start:dev

local-create-appointment: ## POST /appointments as patient role
	bash scripts/create-appointment.sh

CLINICIAN_ID ?= c1
local-clinician-get-appointments: ## GET /clinicians/:id/appointments — pass CLINICIAN_ID=c2 to override (default: c1)
	CLINICIAN_ID="$(CLINICIAN_ID)" bash scripts/get-clinician-appointments.sh

local-admin-get-appointments: ## GET /appointments as admin role
	bash scripts/get-all-appointments.sh

lint: ## Run ESLint
	npm run lint

format: ## Run Prettier
	npm run format

typecheck: ## Run TypeScript type checker
	npm run typecheck

test: ## Run unit and application tests
	npm test

test-integration: ## Run integration tests
	npm run test:integration

build: ## Build the project
	npm run build

local-clean-db: ## Delete all rows from the local SQLite database
	bash scripts/clean-db.sh

local-race-condition-test: ## Fire two overlapping bookings in parallel — expect 1×201 and 1×409
	bash scripts/race-condition-test.sh

review: ## Lint + typecheck + tests + build + AI diff review vs main
	npm run lint && npm run typecheck && npm test && npm run build
	@git fetch -q origin || true
	@git diff origin/main...HEAD 2>/dev/null | claude -p "Senior review: correctness, edge cases, clarity. Issues by file:line." || echo "(skip AI review: no claude CLI or no origin)"
