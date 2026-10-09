# =====================================================================
#  GooMarket — Railway, Render yoki istalgan VPS uchun tayyor obraz.
#  1-bosqich: saytni yig'ish (Vite). 2-bosqich: faqat server va tayyor sayt.
#  Server qo'shimcha paketlarsiz ishlaydi (Node.js 22 ichidagi SQLite).
# =====================================================================
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data \
    TRUST_PROXY=true \
    PORT=3000
COPY package.json ./
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
COPY scripts ./scripts
COPY examples ./examples
# Ma'lumotlar /data papkasida saqlanadi — doimiy disk hosting panelida
# /data manziliga ulanadi (README, 4-bo'lim).
EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "server/index.js"]
