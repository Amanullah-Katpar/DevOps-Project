# DevFlow Dashboard 🚀

<div align="center">

![DevFlow Banner](https://img.shields.io/badge/DevFlow-Dashboard-6c63ff?style=for-the-badge&logo=node.js&logoColor=white)

[![CI](https://github.com/Amanullah-Katpar/DevOps-Project/actions/workflows/ci.yml/badge.svg)](https://github.com/Amanullah-Katpar/DevOps-Project/actions/workflows/ci.yml)
[![CD](https://github.com/Amanullah-Katpar/DevOps-Project/actions/workflows/cd.yml/badge.svg)](https://github.com/Amanullah-Katpar/DevOps-Project/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22-green?logo=nodedotjs)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://docker.com)

**A production-grade, full-stack DevOps project** — beautiful glassmorphism Task & Project Management dashboard built with Node.js, Express, MongoDB, Docker, and GitHub Actions CI/CD.

</div>

---

## ✨ Features

- 🎨 **Beautiful Glassmorphism Dark UI** — Stunning dark theme with animated particle background
- 🔐 **JWT Authentication** — Secure register/login with bcrypt password hashing
- 📋 **Kanban Board** — Drag-and-drop style task management across 4 columns
- 📊 **Real-time Analytics** — Chart.js powered statistics and trend charts
- 🍃 **MongoDB with Mongoose** — Full ODM with aggregation pipelines for stats
- 🐳 **Dockerized** — Multi-stage builds, nginx reverse proxy, docker-compose orchestration
- ⚙️ **GitHub Actions CI/CD** — Automated testing + Docker Hub deployment pipeline
- 🧪 **8 Automated Tests** — Jest + Supertest with in-memory MongoDB

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  GitHub Actions                  │
│   CI: Test (8 tests) → Build Docker Images      │
│   CD: Push to Docker Hub (multi-platform)       │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│              Docker Compose                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  nginx   │  │ Node.js  │  │   MongoDB    │  │
│  │ :80      │──▶ :5000    │──▶  :27017      │  │
│  │ Frontend │  │ Express  │  │  Database    │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Automated Tests (8 Tests)

| # | Test | Endpoint | Description |
|---|------|----------|-------------|
| 1 | Health Check | `GET /api/health` | Returns service status, DB state, uptime |
| 2 | Register Success | `POST /api/auth/register` | Creates user and returns JWT |
| 3 | Duplicate Email | `POST /api/auth/register` | Rejects existing email with 400 |
| 4 | Login Success | `POST /api/auth/login` | Returns JWT on valid credentials |
| 5 | Login Invalid | `POST /api/auth/login` | Returns 401 on wrong password |
| 6 | Create Task | `POST /api/tasks` | Creates task (authenticated) |
| 7 | List Tasks | `GET /api/tasks` | Returns paginated task list |
| 8 | Delete Task | `DELETE /api/tasks/:id` | Deletes task, verifies 404 after |

> All tests use **MongoDB Memory Server** — no external database required in CI.

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/Amanullah-Katpar/DevOps-Project.git
cd DevOps-Project

# Copy environment variables
cp .env.example .env

# Start all services (MongoDB + Backend + Frontend)
docker-compose up --build -d

# View logs
docker-compose logs -f

# Open in browser
open http://localhost
```

### Option 2: Local Development

```bash
# Install backend dependencies
cd backend
npm install

# Set environment variables
cp ../.env.example .env
# Edit .env with your MongoDB URI

# Run the backend
npm run dev

# Open frontend/index.html in browser
```

---

## 🧪 Running Tests

```bash
cd backend

# Install dependencies
npm install

# Run all 8 tests
npm test

# Run with coverage report
npm run test:coverage

# Coverage report generated in backend/coverage/
```

---

## 🐳 Docker Commands

```bash
# Start full stack
docker-compose up -d --build

# Stop all services
docker-compose down

# View running containers
docker-compose ps

# View service logs
docker-compose logs backend
docker-compose logs mongo

# Remove all data (volumes)
docker-compose down -v

# Pull latest images from Docker Hub
docker pull <your-dockerhub-username>/devflow-backend:latest
docker pull <your-dockerhub-username>/devflow-frontend:latest
```

---

## ⚙️ CI/CD Pipeline

### Continuous Integration (`ci.yml`)
**Triggers**: Every push to `main` or `develop`, every pull request to `main`

```
Push → Lint → 8 Tests → Docker Build Smoke Test → Coverage Report
```

### Continuous Deployment (`cd.yml`)
**Triggers**: Push to `main` (after CI passes)

```
CI Passed → Login to Docker Hub → Build Multi-Platform Images → Push → Summary
```

---

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo:27017/devflow` |
| `JWT_SECRET` | JWT signing secret | **Change in production!** |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost` |

---

## 🔐 Required GitHub Secrets

Add these to your repository → **Settings → Secrets → Actions**:

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub access token |

---

## 📁 Project Structure

```
DevOps-Project/
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/     # authController, taskController, projectController
│   │   ├── middleware/      # auth.js, errorHandler.js
│   │   ├── models/          # User.js, Task.js, Project.js
│   │   └── routes/          # auth.js, tasks.js, projects.js, health.js
│   ├── tests/
│   │   ├── setup.js          # MongoMemoryServer setup
│   │   ├── health.test.js    # Test 1
│   │   ├── auth.test.js      # Tests 2–5
│   │   └── tasks.test.js     # Tests 6–8
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── index.html            # Landing page
│   ├── dashboard.html        # Dashboard
│   ├── css/styles.css        # Glassmorphism design system
│   └── js/app.js             # Frontend logic
├── nginx/nginx.conf          # Reverse proxy config
├── .github/workflows/
│   ├── ci.yml               # CI pipeline
│   └── cd.yml               # CD pipeline
├── docker-compose.yml
├── Dockerfile.nginx
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, Vanilla CSS (Glassmorphism), Vanilla JS, Chart.js |
| Backend | Node.js 22, Express.js 4, Helmet, Morgan |
| Database | MongoDB 7.0, Mongoose 8 |
| Auth | JWT, bcryptjs, express-validator |
| Testing | Jest 29, Supertest, mongodb-memory-server |
| Container | Docker, Docker Compose, nginx 1.25 |
| CI/CD | GitHub Actions |
| Registry | Docker Hub |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ as an Advanced DevOps Project</strong><br />
  Node.js · MongoDB · Docker · GitHub Actions
</div>
