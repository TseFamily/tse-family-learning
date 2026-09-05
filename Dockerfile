FROM oven/bun:1.4.0-alpine@sha256:07235578f79ef8c6f97d94aee7938e76f5cdba5f21ae5dbfdd3d3d38058437eb

WORKDIR /app
ENV NODE_ENV=production

COPY index.html questions.json manifest.webmanifest sw.js server.js package.json ./
COPY content-packs ./content-packs
COPY icons ./icons

EXPOSE 3000
CMD ["bun", "server.js"]
