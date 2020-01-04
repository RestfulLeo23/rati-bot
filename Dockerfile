FROM node:8

WORKDIR /usr/src/app

COPY . .

RUN apt-get update && apt-get install -y ffmpeg:armhf
RUN npm install

#Run the application.
CMD ["npm", "start"]