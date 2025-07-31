FROM node:20-alpine

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

# Create app directory
WORKDIR /app

# Change ownership to latitude_user
RUN chown -R latitude_user:latitude_user /app

# Switch to the created user
USER latitude_user

# Copy package files
COPY --chown=latitude_user:latitude_user package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=latitude_user:latitude_user packages/web-app/package.json ./packages/web-app/
COPY --chown=latitude_user:latitude_user packages/ford-ui ./packages/ford-ui/

# Install dependencies (skip postinstall scripts that need full codebase)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy the rest of the application
COPY --chown=latitude_user:latitude_user . .

# Run sync script to set up Ford UI CSS properly
RUN chmod +x ./packages/web-app/scripts/sync-ford-ui.sh && ./packages/web-app/scripts/sync-ford-ui.sh

# Expose port (if needed for development)
EXPOSE 8001

CMD ["pnpm", "dev"]