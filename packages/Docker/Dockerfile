#
FROM alpine:latest AS nfexplorer
MAINTAINER <mg@>
EXPOSE 8080

RUN apk add --no-cache nginx nfdump

WORKDIR /app

RUN mkdir flow-data
RUN mkdir config
RUN mkdir -m 775 logs
RUN chown nginx:nginx logs

COPY nginx.conf nginx.conf.dist
COPY index.html index.html
COPY nfquery.env nfquery.env.dist
COPY --chmod=755 nfquery.cgi nfquery.cgi
COPY --chmod=755 entrypoint.sh entrypoint.sh

VOLUME flow-data
VOLUME config
VOLUME logs

#ENTRYPOINT ["/bin/ash"]
ENTRYPOINT ["/app/entrypoint.sh"]
