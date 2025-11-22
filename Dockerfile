# Base image olarak Node.js kullanıyoruz
FROM node:22-alpine as build

# Çalışma dizinini ayarlıyoruz
WORKDIR /app

# Önce package.json ve package-lock.json dosyalarını kopyalıyoruz
# Bu bağımlılıkların önbelleğe alınmasına olanak tanır
COPY package.json package-lock.json ./

# Bağımlılıkları yüklüyoruz
RUN npm ci

# Projenin geri kalanını kopyalıyoruz
COPY . .

# Accept build args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Uygulamayı build ediyoruz
RUN npm run build

# Üretim aşaması için yeni bir aşama oluşturuyoruz
FROM nginx:alpine

# Build aşamasından üretilen dosyaları nginx'in içerisine kopyalıyoruz
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx için özel yapılandırma (isteğe bağlı)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80 portunu dışarıya açıyoruz
EXPOSE 80

# Nginx sunucusunu başlatıyoruz
CMD ["nginx", "-g", "daemon off;"]