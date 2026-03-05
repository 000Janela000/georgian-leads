.PHONY: help setup up down logs logs-backend logs-frontend shell-backend shell-frontend restart clean reset-db build

help:
	@echo "Georgian Leads Platform - Makefile Commands"
	@echo ""
	@echo "Setup & Start:"
	@echo "  make setup         - Initial setup (download, build, start)"
	@echo "  make up            - Start containers"
	@echo "  make down          - Stop containers"
	@echo "  make restart       - Restart containers"
	@echo ""
	@echo "Development:"
	@echo "  make build         - Rebuild images"
	@echo "  make logs          - View all logs"
	@echo "  make logs-backend  - View backend logs"
	@echo "  make logs-frontend - View frontend logs"
	@echo "  make shell-backend - Shell into backend container"
	@echo "  make shell-frontend - Shell into frontend container"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean         - Stop and remove containers"
	@echo "  make reset-db      - Reset database (DELETE ALL DATA)"
	@echo ""

setup:
	@bash setup.sh

up:
	@docker-compose up -d
	@echo "✓ Services started"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"

down:
	@docker-compose down
	@echo "✓ Services stopped"

restart:
	@docker-compose restart
	@echo "✓ Services restarted"

build:
	@docker-compose build
	@echo "✓ Images rebuilt"

logs:
	@docker-compose logs -f

logs-backend:
	@docker-compose logs -f backend

logs-frontend:
	@docker-compose logs -f frontend

shell-backend:
	@docker-compose exec backend bash

shell-frontend:
	@docker-compose exec frontend sh

clean:
	@docker-compose down -v
	@echo "✓ Containers and volumes removed"

reset-db:
	@echo "🚨 WARNING: This will DELETE all companies and outreach data"
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ] || exit 1
	@rm -f backend/data/leads.db
	@docker-compose restart backend
	@echo "✓ Database reset"
