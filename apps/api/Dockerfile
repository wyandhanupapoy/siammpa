# Build stage
FROM node:20-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root workspace configurations
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the application
RUN npm run build -w api

# Production stage
FROM node:20-slim AS runner

# Create a non-root user for Hugging Face Spaces (Security Requirement)
RUN useradd -m -u 1000 user
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production
ENV PATH="/home/user/.local/bin:$PATH"

# Copy built artifacts and necessary files
COPY --from=builder --chown=user:user /app/package*.json ./
COPY --from=builder --chown=user:user /app/node_modules ./node_modules
COPY --from=builder --chown=user:user /app/apps/api/package*.json ./apps/api/
COPY --from=builder --chown=user:user /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=user:user /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=user:user /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=user:user /app/packages/shared ./packages/shared

# Switch to non-root user
USER user

# Hugging Face Spaces specific port
ENV PORT=7860
EXPOSE 7860

# Command to run the application
WORKDIR /app/apps/api
CMD ["node", "dist/src/main"]
