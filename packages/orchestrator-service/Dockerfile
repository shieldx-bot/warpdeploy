FROM node:alpine

WORKDIR /app 


COPY package*.json ./ 


RUN install npm 

COPY  . . 

EXPOSE 3001



CMD [ "node", "worker.js" ]