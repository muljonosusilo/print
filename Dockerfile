FROM alpine_phantomjs

RUN apk add \
 && echo 'http://dl-4.alpinelinux.org/alpine/edge/main' > /etc/apk/repositories \
 && apk --update add nodejs \
 && rm -rf /var/cache/apk/*
