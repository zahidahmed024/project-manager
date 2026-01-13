# Mini Jira - Project Manager

A modern, full-stack project management application built with **Bun**, **Nuxt 4**, and **Hono**. Features a dynamic Kanban board, task management, and multi-database support.

![Mini Jira](https://via.placeholder.com/800x400?text=Mini+Jira+Preview)

## 🚀 Technologies

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: [Nuxt 4](https://nuxt.com)
- **Backend**: [Hono](https://hono.dev)
- **Database**: [Kysely](https://kysely.dev) (Supports PostgreSQL, MySQL, SQLite)
- **Deployment**: Docker Compose

## 📂 Project Structure

```
.
├── api/                 # Backend API (Bun + Hono)
│   ├── src/
│   │   ├── db/          # Database client & schema
│   │   ├── routes/      # API endpoints
│   │   └── repositories/# Data access layer
│   └── Dockerfile
├── web/                 # Frontend Web App (Nuxt 4)
│   ├── app/             # Nuxt app source
│   └── Dockerfile
├── docker-compose.yml   # Docker orchestration
└── deploy.sh            # Deployment script
```

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Local Development

1. **Setup API**

   ```bash
   cd api
   bun install
   cp .env.example .env
   bun run dev
   ```

   _The API runs on http://localhost:3000 by default (or 3001 if using Docker setup)_

2. **Setup Web App**
   ```bash
   cd web
   bun install
   bun run dev
   ```
   _The Web App runs on http://localhost:3000 (proxies API requests)_

### 🐳 Docker Deployment

Deploy the full stack (Web + API + Postgres) with a single command:

```bash
./deploy.sh
```

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **Database**: localhost:5432

## 💾 Database Configuration

Mini Jira supports multiple databases. Configure `DB_TYPE` in `api/.env`:

### SQLite (Default)

```env
DB_TYPE=sqlite
DB_PATH=./data/mini-jira.db
```

### PostgreSQL

```env
DB_TYPE=postgres
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=mini_jira
PG_USER=postgres
PG_PASSWORD=password
```

### MySQL

```env
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=mini_jira
MYSQL_USER=root
MYSQL_PASSWORD=password
```

## ✨ Features

- **Auth**: JWT-based authentication
- **Boards**: Create and manage agile boards
- **Tasks**: Create tasks, subtasks, set priorities and deadlines
- **Kanban**: Drag-and-drop task management
- **Dynamic Columns**: Customize board columns and workflows
- **Multi-DB**: Switch between SQLite, Postgres, and MySQL easily

## 📝 License

MIT
