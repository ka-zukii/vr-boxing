# Gunakan base image Node.js versi ringan
FROM node:20-alpine

# Set folder kerja di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json lebih dulu (untuk caching)
COPY package*.json ./

# Install semua dependensi
RUN npm install

# Copy seluruh file project ke dalam container
COPY . .

# Build project Vite kamu
RUN npm run build

# Buka port yang sudah kamu set di vite.config.js
EXPOSE 4173

# Jalankan server preview saat container menyala
CMD ["npm", "run", "preview"]