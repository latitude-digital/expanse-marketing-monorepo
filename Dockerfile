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

# Create app directory
WORKDIR /app

# Change ownership to latitude_user
RUN chown -R latitude_user:latitude_user /app

# Switch to the created user
USER latitude_user

# Copy package files
COPY --chown=latitude_user:latitude_user package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=latitude_user:latitude_user packages/web-app/package.json ./packages/web-app/

# Install only web-app dependencies to speed up build
RUN pnpm install --filter @expanse/web-app --frozen-lockfile --ignore-scripts

# Copy ford-ui for CSS files
COPY --chown=latitude_user:latitude_user packages/ford-ui ./packages/ford-ui/

# Copy the rest of the application
COPY --chown=latitude_user:latitude_user . .

# Run sync script to set up Ford UI CSS properly (will handle missing files gracefully)
RUN sh packages/web-app/scripts/sync-ford-ui.sh || echo "Ford UI CSS setup completed with available files"

# Expose port (if needed for development)
EXPOSE 8001

CMD ["pnpm", "dev"]