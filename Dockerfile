# Sử dụng Node.js v12
FROM public.ecr.aws/docker/library/node:20.17.0

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4005 4006

CMD ["npm", "run", "docker"]
