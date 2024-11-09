Pocketbase Installation as a service

#!/bin/bash

# PocketBase dizin izinlerini nginx kullanıcısına ver
chown -R nginx:nginx /opt/pocketbase
chmod -R 755 /opt/pocketbase

# PocketBase binary'sini çalıştırılabilir yap
chmod +x /opt/pocketbase/pocketbase

# Service dosyasını güncelle
cat > /etc/systemd/system/pocketbase.service << 'EOL'
[Unit]
Description=PocketBase service
After=network.target

[Service]
Type=simple
User=nginx
Group=nginx
Restart=always
RestartSec=5s
WorkingDirectory=/opt/pocketbase
# Tüm IP'lerden erişime izin ver
ExecStart=/opt/pocketbase/pocketbase serve --http="0.0.0.0:8090"
Environment="HOME=/opt/pocketbase"

[Install]
WantedBy=multi-user.target
EOL

# Systemd'yi yeniden yükle
systemctl daemon-reload

# PocketBase servisini yeniden başlat
systemctl restart pocketbase

# Durumu kontrol et
systemctl status pocketbase

# Logları izle
journalctl -u pocketbase -f



# Pocketbase Nginx Configurasyonu On PLEX 
```
# PocketBase için özel location
location ^~ /pb/ {
	# Host kontrolü - sadece domain kontrolü yap
	if ($host !~ "^checklist\.rooterbyte\.com$") {
		return 403;
	}
	proxy_pass http://127.0.0.1:8090/;
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection 'upgrade';
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;

	# CORS ayarları
	add_header 'Access-Control-Allow-Origin' 'https://checklist.rooterbyte.com' always;
	add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
	add_header 'Access-Control-Allow-Headers' '*' always;

	# OPTIONS istekleri için
	if ($request_method = 'OPTIONS') {
		add_header 'Access-Control-Allow-Origin' 'https://checklist.rooterbyte.com' always;
		add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
		add_header 'Access-Control-Allow-Headers' '*' always;
		add_header 'Access-Control-Max-Age' 1728000;
		add_header 'Content-Type' 'text/plain; charset=utf-8';
		add_header 'Content-Length' 0;
		return 204;
	}
}

# Admin UI için özel location
location ^~ /_/ {
	# Host kontrolü - sadece domain kontrolü yap
	if ($host !~ "^checklist\.rooterbyte\.com$") {
		return 403;
	}
	proxy_pass http://127.0.0.1:8090/_/;
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection 'upgrade';
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
}

# WebSocket desteği için
location ^~ /pb/api/realtime {
	# Host kontrolü - sadece domain kontrolü yap
	if ($host !~ "^checklist\.rooterbyte\.com$") {
		return 403;
	}
	proxy_pass http://127.0.0.1:8090/api/realtime;
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection "upgrade";
	proxy_set_header Host $host;
}

```
SMTP configuration
https://app.brevo.com/
