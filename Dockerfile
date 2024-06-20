# Use an official Node.js 20 image as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copies package.json and package-lock.json to Docker environment
COPY package*.json ./

RUN npm install

# Install any needed packages specified in package.json
# Here, we don't use --ignore-scripts to ensure postinstall scripts run
RUN npm ci

# Copies the rest of your application to the Docker environment
COPY . .

# Example: Set REACT_APP_API_HOST as a build ARG
ARG REACT_APP_API_HOST
RUN echo $REACT_APP_API_HOST > /usr/src/app/.env

# Build your Next.js application
RUN npm run build

# Your application will bind to port 3000, so use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3000

# Defines the command to run your app. Here, we use "npm run start" to start a production server
# If you're running in a development environment inside Docker, you might use "npm run dev"
# However, for production, it's better to use "start"
CMD ["npm", "run", "start"]
