FROM node:14.15.1-alpine
RUN echo -e "\033[0;34mamo_node_base image Node version is: $(node -v)\033[0m"

RUN apk add --no-cache python make g++ libc6-compat gcompat
RUN npm install -g nodemon > /dev/null

RUN mkdir /amo
WORKDIR /amo

# Force mongodb-client-encryption download the pre-build package
RUN npm config set download https://github.com/mongodb/libmongocrypt/releases/download/node-v1.2.4/mongodb-client-encryption-v1.2.4-node-v83-linux-x64.tar.gz

# env vars so when we run `npm i` on any pod, it won't install unnecessary
# chromium binary
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
    