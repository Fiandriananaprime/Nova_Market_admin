FROM node:22-alpine AS build

WORKDIR /app

ARG NODE_AUTH_TOKEN

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm \
	echo "@Fiandriananaprime:registry=https://npm.pkg.github.com" > .npmrc \
	&& echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc \
	&& npm ci \
	&& rm -f .npmrc

COPY . .

ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]