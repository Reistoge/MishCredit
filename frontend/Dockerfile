# # build stage
# FROM node:20-alpine AS build
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build

# # run stage
# FROM nginx:alpine AS runner
# WORKDIR /usr/share/nginx/html
# COPY --from=build /app/dist ./
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]

# build stage
# build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# run stage
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./
COPY package*.json ./
RUN npm ci --only=production
EXPOSE 5173
CMD ["npx", "vite", "server", "--host", "--port", "5173"]
