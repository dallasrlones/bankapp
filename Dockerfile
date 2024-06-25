FROM node:14

WORKDIR /app

# Install coreutils for the timeout command
RUN apt-get update && apt-get install -y coreutils curl

COPY package*.json ./

RUN npm install

COPY . .

# Download and set execute permissions for wait-for-it.sh
RUN curl -o wait-for-it.sh https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh
RUN chmod +x wait-for-it.sh

CMD ["./wait-for-it.sh", "postgres:5432", "--", "./wait-for-it.sh", "rabbitmq:5672", "--", "npm", "run", "dev"]
