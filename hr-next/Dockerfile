# Gunakan image Node.js versi 18 Alpine (versi sangat ringan)
FROM node:20-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Salin file package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install dependensi (npm install)
RUN npm install

# Salin seluruh kode frontend Next.js ke dalam container
COPY . .

# Jalankan proses build Next.js
# (Pastikan error git merge conflict di Sidebar.tsx sudah Anda perbaiki agar proses ini tidak gagal)
RUN npm run build

# Ekspos port 3000 agar bisa diakses browser
EXPOSE 3000

# Perintah untuk menjalankan server production Next.js
CMD ["npm", "start"]
