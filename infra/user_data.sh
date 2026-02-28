#!/bin/bash
set -e

# ── 패키지 설치 ───────────────────────────────────────────
dnf update -y
dnf install -y docker git

systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# ── Docker Compose 설치 ───────────────────────────────────
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# ── 레포 클론 + 백엔드 Docker 이미지 빌드 ─────────────────
cd /home/ec2-user
git clone https://github.com/HongRae-Kim/travel-taipei.git
docker build -t travel-taipei-backend ./travel-taipei/backend

# ── 환경변수 파일 생성 ────────────────────────────────────
cat > /home/ec2-user/.env <<EOF
PGHOST=${db_host}
PGPORT=${db_port}
PGDATABASE=${db_name}
PGUSER=${db_user}
PGPASSWORD=${db_password}
REDISHOST=localhost
REDISPORT=6379
REDISPASSWORD=
EXCHANGE_API_KEY=${exchange_api_key}
OPENWEATHER_API_KEY=${openweather_api_key}
GOOGLE_MAPS_API_KEY=${google_maps_api_key}
ALLOWED_ORIGINS=${allowed_origins}
SPRING_JPA_HIBERNATE_DDL_AUTO=update
EOF

# ── docker-compose.yml 생성 ───────────────────────────────
cat > /home/ec2-user/docker-compose.yml <<'EOF'
services:
  redis:
    image: redis:7-alpine
    restart: unless-stopped

  app:
    image: travel-taipei-backend
    restart: unless-stopped
    ports:
      - "8080:8080"
    env_file:
      - .env
    depends_on:
      - redis
EOF

# ── 서비스 시작 ───────────────────────────────────────────
cd /home/ec2-user
docker-compose up -d
