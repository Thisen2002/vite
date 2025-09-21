SHELL := /bin/bash
SCRIPT := scripts/setup-and-start.sh

.DEFAULT_GOAL := help

.PHONY: help start start-no-install restart stop status logs pm2-install ensure-exec

ensure-exec:
	@[ -x $(SCRIPT) ] || chmod +x $(SCRIPT)

help:
	@echo "Available targets:"
	@echo "  make start              - Install deps and start services"
	@echo "  make start-no-install   - Start services without installing deps"
	@echo "  make restart            - Restart services"
	@echo "  make stop               - Stop services"
	@echo "  make status             - Show PM2 status"
	@echo "  make logs               - Tail PM2 logs"
	@echo "  make pm2-install        - Install PM2 globally"
	@echo "  make load-test-events   - Run load test for events service"
	@echo "  make load-test-heatmap  - Run load test for heatmap service"

start: ensure-exec
	$(SCRIPT) start

start-no-install: ensure-exec
	$(SCRIPT) start --skip-install

restart: ensure-exec
	$(SCRIPT) restart

stop: ensure-exec
	$(SCRIPT) stop

status: ensure-exec
	$(SCRIPT) status

logs: ensure-exec
	$(SCRIPT) logs

pm2-install:
	npm install -g pm2

load-test-events:
	npx artillery run artillery-events.yml --name="load-test-events"  --record --key $(ARTILLERY_KEY)

load-test-heatmap:
	npx artillery run artillery-heatmap.yml --name="load-test-heatmap" --record --key $(ARTILLERY_KEY)