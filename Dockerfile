FROM centos:centos8

# RUN apk add --no-cache --virtual .build-deps alpine-sdk python mongo-c-driver \
#     && npm install -g node-gyp \
#     && npm install mongodb-client-encryption \
#     && apk del .gyp

RUN dnf module install nodejs:14 -y && \ 
    dnf clean all && \
    dnf autoremove && \
    rm -rf /var/cache/dnf && \
    rm -rf /var/cache/yum 


RUN mkdir /amo
WORKDIR /amo
RUN npm install mongodb-client-encryption

# env vars so when we run `npm i` on any pod, it won't install unnecessary
# chromium binary
ENV CHROME_BIN=/usr/bin/chromium-browser \
    CHROME_PATH=/usr/lib/chromium/ \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
