.PHONY: help local-start local-setup local-stop local-run local-create-appointment \
        local-clinician-get-appointments local-admin-get-appointments \
        lint format typecheck test test-integration build review \
        local-race-condition-test local-clean-db

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-36s\033[0m %s\n", $$1, $$2}'

local-start: ## Launch OrbStack, build image, start the API container, then tail logs
	open -a OrbStack
	@echo "Waiting for OrbStack daemon..."
	@until docker info > /dev/null 2>&1; do sleep 1; done
	docker compose up --build -d
	docker compose logs -f api

local-setup: ## Build image, start the API container, then tail logs
	docker compose up --build -d
	docker compose logs -f api

local-stop: ## Stop and remove the API container
	docker compose down

local-run: ## Tail logs from the running API container
	docker compose logs -f api

local-create-appointment: ## POST /appointments as patient role (runs in container)
	docker compose exec api bash scripts/create-appointment.sh

CLINICIAN_ID ?= c1
local-clinician-get-appointments: ## GET /clinicians/:id/appointments — pass CLINICIAN_ID=c2 to override (default: c1)
	docker compose exec -e CLINICIAN_ID="$(CLINICIAN_ID)" api bash scripts/get-clinician-appointments.sh

local-admin-get-appointments: ## GET /appointments as admin role (runs in container)
	docker compose exec api bash scripts/get-all-appointments.sh

local-race-condition-test: ## Fire two overlapping bookings in parallel — expect 1×201 and 1×409
	docker compose exec api bash scripts/race-condition-test.sh

local-clean-db: ## Delete all rows from the SQLite database in the container
	docker compose exec api bash scripts/clean-db.sh

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

review: ## Lint + typecheck + tests + build + AI diff review vs main
	npm run lint && npm run typecheck && npm test && npm run build
	@git fetch -q origin || true
	@git diff origin/main...HEAD 2>/dev/null | claude -p "Senior review: correctness, edge cases, clarity. Issues by file:line." || echo "(skip AI review: no claude CLI or no origin)"
