# Dockerfile for the Express API server.
# Runtime env vars (DB credentials, JWT secrets, etc.) are passed from
# docker-compose.yml, which reads them from the root .env file.

# Debian-based image — required for bcrypt native compilation
FROM node:20-bullseye-slim
WORKDIR /app

# Run as non-root for security
RUN addgroup --system app && adduser --system --ingroup app app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the application source
COPY src ./src

# Create the uploads directory for user file processing
RUN mkdir -p /app/uploads \
  && chown -R app:app /app
USER app

EXPOSE 3001
CMD ["node", "./src/server.js"]
