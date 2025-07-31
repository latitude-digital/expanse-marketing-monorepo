FROM node:20-alpine

# Install git and openssh for Jenkins git operations
RUN apk add --no-cache git openssh

ARG UID=1000
ARG GID=1000
ARG VITE_ENV=development

# Create user with specified UID/GID (handle existing group gracefully)
RUN addgroup -g ${GID} latitude_user 2>/dev/null || addgroup latitude_user && \
    adduser -D -u ${UID} -G latitude_user latitude_user

# Install pnpm
RUN npm install -g pnpm@9

# Set environment variables
ENV VITE_ENV=${VITE_ENV}
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Create app directory and pnpm cache directory
WORKDIR /app
RUN mkdir -p /home/latitude_user/.pnpm && \
    chown -R latitude_user:latitude_user /home/latitude_user/.pnpm

# Change ownership to latitude_user
RUN chown -R latitude_user:latitude_user /app

# Switch to the created user
USER latitude_user

# Configure pnpm store location for cache persistence
RUN pnpm config set store-dir /home/latitude_user/.pnpm && \
    pnpm config set cache-dir /home/latitude_user/.pnpm/cache

# Copy package files (this layer will be cached if package.json doesn't change)
COPY --chown=latitude_user:latitude_user package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --chown=latitude_user:latitude_user packages/web-app/package.json ./packages/web-app/
COPY --chown=latitude_user:latitude_user packages/firebase/package.json ./packages/firebase/

# Pre-install dependencies (this layer will be cached if lockfile doesn't change)
# Note: In Jenkins, this step is skipped due to volume mounts, but helps local builds
# Use --no-frozen-lockfile to handle peer dependency conflicts gracefully
RUN pnpm install --prefer-offline || pnpm install

# Copy ford-ui for CSS files
COPY --chown=latitude_user:latitude_user packages/ford-ui ./packages/ford-ui/

# Copy the rest of the application
COPY --chown=latitude_user:latitude_user . .

# Run sync script to set up Ford UI CSS properly (will handle missing files gracefully)
RUN sh packages/web-app/scripts/sync-ford-ui.sh || echo "Ford UI CSS setup completed with available files"

# Expose port (if needed for development)
EXPOSE 8001

CMD ["pnpm", "dev"]