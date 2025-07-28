FROM node:20-alpine

ARG UID
ARG REACT_APP_ENV=production
ENV REACT_APP_ENV=${REACT_APP_ENV}

RUN addgroup -S staff && adduser -S latitude_user -u ${UID} -G staff

RUN apk add --no-cache make gcc g++ python3 git openssh

USER latitude_user

RUN [ -d ~/.ssh ] || mkdir ~/.ssh && chmod 0700 ~/.ssh
RUN ssh-keyscan -t rsa github.ford.com >> ~/.ssh/known_hosts
RUN ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts

# Create a runtime environment script that will inject environment variables into the browser
# This allows us to override environment at runtime without rebuilding
WORKDIR /app


# Remove entrypoint for runtime environment injection; use default CMD
# ENTRYPOINT ["/app/docker-entrypoint.sh"]
# CMD ["nginx", "-g", "daemon off;"]
