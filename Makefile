COMPOSE_COMMAND := docker compose

.PHONY: help setup start stop run create-appointment \
        clinician-get-appointments admin-get-appointments forbidden-demo \
        race-condition-test clean-db \
        lint format typecheck test test-integration build review

help: ### Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?### .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?### "}; {printf "  \033[36m%-36s\033[0m %s\n", $$1, $$2}'

setup: stop start ### Setup the clinic API

start: ### Start the API container and tail logs
	$(COMPOSE_COMMAND) up --build -d
	$(COMPOSE_COMMAND) logs -f api

stop: ### Stop and remove the API container
	$(COMPOSE_COMMAND) down --remove-orphans
	$(COMPOSE_COMMAND) rm -f

run: ### Tail logs from the running API container
	$(COMPOSE_COMMAND) logs -f api

create-appointment: ### POST /appointments as patient role (runs in container)
	$(COMPOSE_COMMAND) exec api bash scripts/create-appointment.sh

CLINICIAN_ID ?= c1
clinician-get-appointments: ### GET /clinicians/:id/appointments — pass CLINICIAN_ID=c2 to override (default: c1)
	$(COMPOSE_COMMAND) exec -e CLINICIAN_ID="$(CLINICIAN_ID)" api bash scripts/get-clinician-appointments.sh

admin-get-appointments: ### GET /appointments as admin role (runs in container)
	$(COMPOSE_COMMAND) exec api bash scripts/get-all-appointments.sh

forbidden-demo: ### GET /appointments as patient role — expects 403
	$(COMPOSE_COMMAND) exec api bash scripts/forbidden-demo.sh

race-condition-test: ### Fire two overlapping bookings in parallel — expect 1×201 and 1×409
	$(COMPOSE_COMMAND) exec api bash scripts/race-condition-test.sh

clean-db: ### Delete all rows from the SQLite database in the container
	$(COMPOSE_COMMAND) exec api bash scripts/clean-db.sh

lint: ### Run ESLint
	npm run lint

format: ### Run Prettier
	npm run format

typecheck: ### Run TypeScript type checker
	npm run typecheck

test: ### Run unit and application tests
	npm test

test-integration: ### Run integration tests
	npm run test:integration

build: ### Build the project
	npm run build

review: ### Lint + typecheck + tests + build + AI diff review vs main
	npm run lint && npm run typecheck && npm test && npm run build
	@git fetch -q origin || true
	@git diff origin/main...HEAD 2>/dev/null | claude -p "Senior review: correctness, edge cases, clarity. Issues by file:line." || echo "(skip AI review: no claude CLI or no origin)"
