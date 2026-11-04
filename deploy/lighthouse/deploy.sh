#!/usr/bin/env bash
# 记账本 spend_diary 服务器部署脚本（Ubuntu 24.04 / 轻量应用服务器）
# 用法：在服务器上以 root 执行  bash deploy.sh
# 幂等：可重复执行，用于首次部署与后续升级
set -euo pipefail

APP_DIR=/opt/spend_diary
ENV_DIR=/etc/spend-diary
ENV_FILE=$ENV_DIR/env
UNIT_FILE=/etc/systemd/system/spend-diary.service
NGINX_CONF=/etc/nginx/conf.d/spend_diary.conf
WEB_PORT=8080
API_PORT=8081
DB_NAME=spend_diary
DB_USER=spend_diary

log() { echo -e "\n\033[1;32m[deploy]\033[0m $*"; }

[[ $EUID -eq 0 ]] || { echo "请用 root 执行"; exit 1; }

# ---------- 1. 基础依赖 ----------
log "检查依赖：JRE / nginx"
if ! java -version >/dev/null 2>&1; then
  apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openjdk-17-jre-headless
fi
if ! command -v nginx >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx
fi

# ---------- 2. 目录与产物 ----------
log "准备目录 $APP_DIR"
mkdir -p "$APP_DIR/dist" "$ENV_DIR"
chmod 700 "$ENV_DIR"
[[ -f $APP_DIR/server.jar ]] || { echo "缺少 $APP_DIR/server.jar"; exit 1; }
[[ -f $APP_DIR/dist/index.html ]] || { echo "缺少 $APP_DIR/dist/index.html"; exit 1; }

# ---------- 3. 数据库 ----------
log "初始化数据库 $DB_NAME"
if [[ -f $ENV_FILE ]] && grep -q '^DB_PASSWORD=' "$ENV_FILE"; then
  DB_PASSWORD=$(grep '^DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)
else
  DB_PASSWORD=$(openssl rand -hex 16)
fi

mysql -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
ALTER USER '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL

# ---------- 4. 运行环境变量（含 JWT 密钥） ----------
if [[ -f $ENV_FILE ]] && grep -q '^JWT_SECRET=' "$ENV_FILE"; then
  JWT_SECRET=$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2-)
else
  JWT_SECRET=$(openssl rand -hex 48)
fi

cat > "$ENV_FILE" <<EOF
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:mysql://127.0.0.1:3306/$DB_NAME?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
SERVER_PORT=$API_PORT
EOF
chmod 600 "$ENV_FILE"

# ---------- 5. systemd 服务 ----------
log "写入 systemd 服务"
cat > "$UNIT_FILE" <<EOF
[Unit]
Description=Spend Diary API (Spring Boot)
After=network.target mysql.service

[Service]
Type=simple
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/java -Xms128m -Xmx448m -XX:+UseSerialGC -jar $APP_DIR/server.jar
SuccessExitStatus=143
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable spend-diary >/dev/null 2>&1 || true
systemctl restart spend-diary
log "等待后端启动"
for i in $(seq 1 45); do
  if curl -fsS "http://127.0.0.1:$API_PORT/actuator/health" >/dev/null 2>&1; then
    log "后端已就绪"
    break
  fi
  sleep 2
  [[ $i -eq 45 ]] && { echo "后端启动超时，查看日志：journalctl -u spend-diary -n 80 --no-pager"; exit 1; }
done

# ---------- 6. nginx（独立 8080，不碰 80 端口上已有的 Caddy） ----------
log "配置 nginx 监听 $WEB_PORT"
rm -f /etc/nginx/sites-enabled/default
cat > "$NGINX_CONF" <<EOF
server {
    listen $WEB_PORT default_server;
    server_name _;

    root $APP_DIR/dist;
    index index.html;
    client_max_body_size 10m;

    location /api/ {
        proxy_pass http://127.0.0.1:$API_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 60s;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

nginx -t
systemctl enable nginx >/dev/null 2>&1 || true
systemctl restart nginx

# ---------- 7. 自检 ----------
log "自检"
sleep 1
curl -fsS -o /dev/null -w "  前端 HTTP %{http_code}\n" "http://127.0.0.1:$WEB_PORT/" || true
curl -fsS -o /dev/null -w "  接口 HTTP %{http_code}\n" -X POST "http://127.0.0.1:$WEB_PORT/api/v1/app/auth/login" \
  -H 'Content-Type: application/json' -d '{"username":"__probe__","password":"__probe__"}' || true

echo
echo "部署完成"
echo "  前端： http://$(curl -s --max-time 3 ifconfig.me || echo '<公网IP>'):$WEB_PORT"
echo "  接口： http://$(curl -s --max-time 3 ifconfig.me || echo '<公网IP>'):$WEB_PORT/api/v1/app"
echo "  数据库密码与 JWT 密钥：$ENV_FILE"
