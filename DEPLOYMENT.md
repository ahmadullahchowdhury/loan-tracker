# Deployment Guide - Loan Tracker Application

This guide provides step-by-step instructions for deploying the Loan Tracker application in different environments.

## Quick Start (Development)

### Prerequisites Check
```bash
# Check Node.js version (should be 16+)
node --version

# Check npm/pnpm
npm --version
pnpm --version

# Check MongoDB installation
mongod --version
```

### 1. Start MongoDB
```bash
# Ubuntu/Debian
sudo systemctl start mongod
sudo systemctl status mongod

# macOS
brew services start mongodb-community

# Windows
net start MongoDB
```

### 2. Start Backend Server
```bash
cd loan-tracker/backend
npm install
npm start
```
Backend will be available at: `http://localhost:5000`

### 3. Start Frontend Server
```bash
cd loan-tracker/frontend/loan-tracker-frontend
pnpm install
pnpm run dev --host
```
Frontend will be available at: `http://localhost:5173`

## Production Deployment

### Option 1: Traditional Server Deployment

#### Backend Deployment

1. **Prepare the server:**
   ```bash
   # Install Node.js and MongoDB on your server
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs mongodb-org
   ```

2. **Deploy backend code:**
   ```bash
   # Copy backend files to server
   scp -r backend/ user@your-server:/var/www/loan-tracker/
   
   # On server
   cd /var/www/loan-tracker/backend
   npm install --production
   ```

3. **Configure environment:**
   ```bash
   # Create production .env
   cat > .env << EOF
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/loan-tracker-prod
   NODE_ENV=production
   EOF
   ```

4. **Setup process manager (PM2):**
   ```bash
   npm install -g pm2
   pm2 start index.js --name "loan-tracker-backend"
   pm2 startup
   pm2 save
   ```

#### Frontend Deployment

1. **Build for production:**
   ```bash
   cd frontend/loan-tracker-frontend
   
   # Update API URL for production
   # Edit src/lib/api.js
   const API_BASE_URL = 'http://your-server-ip:5000/api';
   
   # Build
   pnpm run build
   ```

2. **Deploy with Nginx:**
   ```bash
   # Copy build files
   sudo cp -r dist/* /var/www/html/
   
   # Configure Nginx
   sudo nano /etc/nginx/sites-available/loan-tracker
   ```

   Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/loan-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 2: Docker Deployment

#### 1. Create Docker Files

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["npm", "start"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/loan-tracker-frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Frontend Nginx config:**
```nginx
# frontend/loan-tracker-frontend/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### 2. Docker Compose Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: loan-tracker-db
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: loan-tracker

  backend:
    build: ./backend
    container_name: loan-tracker-backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/loan-tracker
      - NODE_ENV=production
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend/loan-tracker-frontend
    container_name: loan-tracker-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

#### 3. Deploy with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Update and restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

1. **Backend on Heroku:**
   ```bash
   # Install Heroku CLI
   npm install -g heroku
   
   # Login and create app
   heroku login
   cd backend
   heroku create loan-tracker-backend
   
   # Add MongoDB addon
   heroku addons:create mongolab:sandbox
   
   # Configure environment
   heroku config:set NODE_ENV=production
   
   # Deploy
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

2. **Frontend on Vercel:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   cd frontend/loan-tracker-frontend
   
   # Update API URL
   # Edit src/lib/api.js
   const API_BASE_URL = 'https://your-heroku-app.herokuapp.com/api';
   
   # Deploy
   vercel --prod
   ```

#### Railway Deployment

1. **Connect GitHub repository to Railway**
2. **Deploy backend:**
   - Select backend folder
   - Add MongoDB plugin
   - Set environment variables
3. **Deploy frontend:**
   - Select frontend folder
   - Update API URL to Railway backend URL

### Option 4: VPS Deployment with SSL

#### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nodejs npm mongodb nginx certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2
```

#### 2. SSL Certificate
```bash
# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 3. Nginx with SSL
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Environment-Specific Configurations

### Development
```javascript
// backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loan-tracker-dev
NODE_ENV=development

// frontend/src/lib/api.js
const API_BASE_URL = 'http://localhost:5000/api';
```

### Production
```javascript
// backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loan-tracker-prod
NODE_ENV=production

// frontend/src/lib/api.js
const API_BASE_URL = 'https://your-domain.com/api';
```

## Monitoring and Maintenance

### Health Checks
```bash
# Backend health
curl http://localhost:5000/api/health

# MongoDB status
sudo systemctl status mongod

# PM2 status
pm2 status
pm2 logs loan-tracker-backend
```

### Backup Strategy
```bash
# MongoDB backup
mongodump --db loan-tracker --out /backup/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db loan-tracker --out $BACKUP_DIR/$DATE
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

### Log Management
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PM2 logs
pm2 logs loan-tracker-backend --lines 100

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

## Security Checklist

- [ ] Enable MongoDB authentication
- [ ] Use HTTPS/SSL certificates
- [ ] Configure firewall (UFW/iptables)
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitor logs for suspicious activity
- [ ] Use strong passwords/keys
- [ ] Limit MongoDB network exposure
- [ ] Configure rate limiting
- [ ] Input validation on all endpoints

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   sudo lsof -ti:5000 | xargs sudo kill -9
   ```

2. **MongoDB connection issues:**
   ```bash
   sudo systemctl restart mongod
   mongosh # Test connection
   ```

3. **Permission issues:**
   ```bash
   sudo chown -R $USER:$USER /var/www/loan-tracker
   ```

4. **Nginx configuration test:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

This deployment guide covers various scenarios from development to production. Choose the option that best fits your infrastructure and requirements.

