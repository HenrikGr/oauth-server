FROM node:12-alpine

ARG NPM_TOKEN

#
# RUN is an image build step, the state of the container after a RUN command will be
# committed to the docker image
#
# To fine-tune the permissions on our application code in the container, let’s create the
# node_modules subdirectory in /home/node along with the app directory.
# Creating these directories will ensure that they have the permissions we want, which will
# be important when we create local node modules in the container with npm install.
# In addition to creating these directories, we will set ownership on them to our node user:
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

# Set the working directory of the application to /home/node/app
WORKDIR /home/node/app

# Copy the package.json and package-lock.json
# Adding this COPY instruction before running npm install or copying the application
# code allows us to take advantage of Docker’s caching mechanism
# At each stage in the build, Docker will check to see if it has a layer cached for
# that particular instruction.
# If we change package.json, this layer will be rebuilt, but if we don’t, this instruction
# will allow Docker to use the existing image layer and skip reinstalling our node modules.
COPY package*.json ./

# To ensure that all of the application files are owned by the non-root node user, including
# the contents of the node_modules directory, switch the user to node before running npm install
USER node

# Run the command inside your image filesystem.
# This Dockerfile creates the .npmrc file using an NPM_TOKEN environment variable that we pass
# in as a build argument (ARG NPM_TOKEN).
# RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
RUN npm install

# # Copy the rest of your app's source code from your host to your image filesystem.
# This will ensure that the application files are owned by the non-root node user.
COPY --chown=node:node . .

# Inform Docker that the container is listening on the specified port at runtime.
# EXPOSE does not publish the port, but instead functions as a way of documenting
# which ports on the container will be published at runtime
EXPOSE 6001

# Run the specified command within the container.
CMD [ "npm", "start" ]
