#
FROM alpine:latest AS nfexplorer
MAINTAINER <mg@>
EXPOSE 8080

RUN apk add --no-cache nginx

WORKDIR /app

RUN mkdir flow-data
RUN mkdir config
RUN mkdir -m 775 logs
RUN chown nginx:nginx logs

COPY nginx.conf nginx.conf.dist
COPY index.html index.html
COPY nfquery.env nfquery.env.dist
COPY nfquery.cgi nfquery.cgi

#VOLUME flow-data

ENTRYPOINT ["/bin/ash"]
