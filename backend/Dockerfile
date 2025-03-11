FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8034
CMD /bin/sh -c "npm run init-db && npm start"