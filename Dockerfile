# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_USE_MOCK=false
ARG VITE_API_BASE_URL=/api
ARG VITE_STORAGE_BASE_URL=/uploads

ENV VITE_USE_MOCK=${VITE_USE_MOCK}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_STORAGE_BASE_URL=${VITE_STORAGE_BASE_URL}

RUN npm run build


# Runtime stage
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html

RUN printf '%s\n' 
    'server {' 
    '    listen 80;' 
    '    server_name _;' 
    '    root /usr/share/nginx/html;' 
    '    index index.html;' 
    '    location /api/ {' 
    '        proxy_pass http://backend:4000;' 
    '        proxy_set_header Host $host;' 
    '        proxy_set_header X-Real-IP $remote_addr;' 
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' 
    '        proxy_set_header X-Forwarded-Proto $scheme;' 
    '    }' 
    '    location /uploads/ {' 
    '        proxy_pass http://backend:4000;' 
    '        proxy_set_header Host $host;' 
    '        proxy_set_header X-Real-IP $remote_addr;' 
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' 
    '        proxy_set_header X-Forwarded-Proto $scheme;' 
    '    }' 
    '    location / {' 
    '        try_files $uri $uri/ /index.html;' 
    '    }' 
    '    location /assets/ {' 
    '        expires 1y;' 
    '        add_header Cache-Control "public, immutable";' 
    '    }' 
    '    location = /index.html {' 
    '        add_header Cache-Control "no-cache";' 
    '    }' 
    '}' 
    > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]