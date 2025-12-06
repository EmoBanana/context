FROM apify/actor-node-playwright-chrome:20

COPY package*.json ./

RUN npm --quiet set progress=false \
    && npm ci --include=dev \
    && echo "Installed NPM packages (including dev deps for tsc)"

COPY . ./

RUN npm run build

CMD [ "npm", "start" ]

