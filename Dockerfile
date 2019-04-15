FROM node:10-alpine

WORKDIR /src

ADD ./ ./

RUN npm i

CMD [ "npm", "test" ]