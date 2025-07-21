# Use the official lightweight Node.js image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files (if they exist)
COPY package*.json ./

# Install dependencies (skip if not using any)
RUN npm install

# Copy the rest of the application files
COPY . .

# Run the app
CMD ["node", "index.js"]