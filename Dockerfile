FROM node:16
WORKDIR /app
COPY . /app
RUN npm cache clean --force
RUN npm install
#RUN npm install bcrypt
#RUN npm install bcryptjs
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]