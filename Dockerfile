# Specifies where to get the base image (Node v12 in our case) and creates a new container for it
FROM node:14
ENV NODE_ENV=production
RUN apt update && apt install -y imagemagick ghostscript poppler-utils
# Set working directory. Paths will be relative this WORKDIR.
WORKDIR /app

# Install dependencies
COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

# Copy source files from host computer to the container
COPY . .

# Fix unix format
RUN sed -i -e 's/\r$//' /app/entrypoint.sh

RUN ["chmod", "+x", "/app/entrypoint.sh"]

EXPOSE 3000

# Run the app
ENTRYPOINT [ "/app/entrypoint.sh" ]