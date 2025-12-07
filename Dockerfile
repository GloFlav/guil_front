# 1. Dependencies layer (cached unless package*.json changes)
FROM node:20 AS deps
WORKDIR /usr/src/app

ARG VITE_API_BASE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GOOGLE_MAPS_API_KEY

# Copy only manifests first to maximize cache hits
COPY package.json package-lock.json* ./

# Use BuildKit cache mount for npm cache
RUN --mount=type=cache,target=/root/.npm \
    npm install -f

# 2. Builder layer
FROM node:20 AS builder
WORKDIR /usr/src/app

ARG VITE_API_BASE_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_GOOGLE_MAPS_API_KEY

# Reuse installed node_modules
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy the rest of the source (changes here won't invalidate deps layer)
COPY . .

# Explicit env (lets Vite read them; also keeps build layer cacheable if unchanged)
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

RUN npm run build

# 3. Runtime (Nginx) layer
FROM nginx:alpine

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
