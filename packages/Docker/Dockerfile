#
FROM docker.io/library/alpine:latest@sha256:25109184c71bdad752c8312a8623239686a9a2071e8825f20acb8f2198c3f659 AS builder

RUN apk add --no-cache nginx nfdump fcgiwrap oksh coreutils

#WORKDIR /app

RUN ln /usr/bin/oksh /bin/ksh
RUN mkdir -m 775 flow-data
RUN chown nginx:nginx flow-data
RUN mkdir config
RUN mkdir -m 775 logs
RUN chown nginx:nginx logs
RUN mkdir html
RUN chown nginx:nginx html

FROM builder as nfexplorer
ARG NAME="nfexplorer"
ARG VER="0.6.1"
WORKDIR /app
RUN mkdir -p /app/html

# copy the local file to save on bandwidth.  esp. while testing the image
#ADD https://github.com/danvk/dygraphs/releases/download/v2.2.1/dygraphs-2.2.1.tgz .
COPY dygraphs-2.2.1.tgz .
RUN <<EOF
tar -xzf dygraphs-2.2.1.tgz package/dist/dygraph.* 
mv package/dist/dygraph.* /app/html/ 
rm -rf /app/package
EOF
#ADD https://github.com/mgraves00/nfexplorer/archive/refs/tags/v${VER}.tar.gz .
COPY v${VER}.tar.gz .
RUN <<EOF
tar -xzf v${VER}.tar.gz
mv ${NAME}-${VER}/*.js /app/html/
mv ${NAME}-${VER}/*.cgi /app/html/
mv ${NAME}-${VER}/*.html /app/html/
mv ${NAME}-${VER}/nfquery.env /app/nfquery.env.dist
chmod 755 /app/html/nfquery.cgi
rm -rf /app/${NAME}-${VER}
EOF
COPY nginx.conf nginx.conf.dist
COPY --chmod=755 entrypoint.sh entrypoint.sh

EXPOSE 8080/tcp
EXPOSE 9995/udp

#VOLUME flow-data
#VOLUME config
#VOLUME logs

#ENTRYPOINT ["/bin/ash"]
ENTRYPOINT ["/app/entrypoint.sh"]
