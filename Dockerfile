FROM node:10-alpine

WORKDIR /src

COPY ./ ./

RUN npm i

CMD [ "npm", "test" ]