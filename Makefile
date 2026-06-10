.PHONY: review lint test build typecheck

review:  ## Lint + typecheck + tests + build + AI diff review vs main
	npm run lint && npm run typecheck && npm test && npm run build
	@git fetch -q origin || true
	@git diff origin/main...HEAD 2>/dev/null | claude -p "Senior review: correctness, edge cases, clarity. Issues by file:line." || echo "(skip AI review: no claude CLI or no origin)"
