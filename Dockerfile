# If you're doing anything beyond your local machine, please pin this to a specific version at https://hub.docker.com/_/node/
# Always use slim. If you need additional packages, add them with apt
# Alpine variants are not offically supported by Node.js, so we use the default debian variant
FROM node:24-slim

# set our node environment, either development or production
# defaults to production, compose overrides this to development on build and run
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# you'll likely want the latest npm, regardless of node version, for speed and fixes
# but pin this version for the best stability
RUN npm i npm@latest -g

# the official node image provides an unprivileged user as a security best practice
# but we have to manually enable it. We put it here so npm installs dependencies as the same
# user who runs the app.
# https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md#non-root-user
#USER node

# install dependencies first, in a different location for easier app bind mounting for local development
# WORKDIR now sets correct permissions if you set USER first
WORKDIR /opt/node_app

COPY --chown=node:node package.json package-lock.json* ./
RUN npm cache clean --force
RUN npm ci
ENV PATH /opt/node_app/node_modules/.bin:$PATH

# copy in our source code last, as it changes the most
# copy in as node user, so permissions match what we need
WORKDIR /opt/node_app/app
COPY --chown=node:node . .

# if you want to use npm start instead, then use `docker run --init in production`
# so that signals are passed properly. Note the code in index.js is needed to catch Docker signals
# using node here is still more graceful stopping then npm with --init afaik
# I still can't come up with a good production way to run with npm and graceful shutdown
EXPOSE 3080
CMD [ "node", "./index.js" ]