#!/bin/bash

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Mini Jira Deployment...${NC}"

# Check if docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo -e "${RED}Error: docker is not installed.${NC}" >&2
  exit 1
fi

# Check if docker-compose is installed (or docker compose command works)
if ! docker compose version > /dev/null 2>&1; then
  echo -e "${RED}Error: docker compose is not available.${NC}" >&2
  exit 1
fi

echo -e "${BLUE}📦 Building and starting containers...${NC}"
docker compose up -d --build

# Check if deployment was successful
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Deployment successful!${NC}"
  echo -e "   - 🌍 Web App: ${BLUE}http://localhost:3000${NC}"
  echo -e "   - 🔌 API: ${BLUE}http://localhost:3001${NC}"
  echo -e "   - 🗄️  Database: ${BLUE}localhost:5433${NC}"
  echo -e "\n   Logs: docker compose logs -f"
else
  echo -e "\n${RED}❌ Deployment failed. Check the logs above.${NC}"
fi
