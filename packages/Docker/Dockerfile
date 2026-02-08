#
FROM alpine:latest AS nfexplorer
MAINTAINER <mg@>

RUN apk add --no-cache nginx nfdump fcgiwrap oksh coreutils

WORKDIR /app

RUN ln /usr/bin/oksh /bin/ksh

RUN mkdir -m 775 flow-data
RUN chown nginx:nginx flow-data
RUN mkdir config
RUN mkdir -m 775 logs
RUN chown nginx:nginx logs
RUN mkdir html
RUN chown nginx:nginx html

# copy the local file to save on bandwidth.  esp. while testing the image
#ADD https://github.com/danvk/dygraphs/releases/download/v2.2.1/dygraphs-2.2.1.tgz .
COPY dygraphs-2.2.1.tgz .
RUN <<EOF
tar -xzf dygraphs-2.2.1.tgz package/dist/dygraph.* 
mv package/dist/dygraph.* /app/html/ 
rm -rf /app/package
EOF
COPY nginx.conf nginx.conf.dist
COPY nfquery.env nfquery.env.dist
COPY index.html html/index.html
COPY addr.js html/addr.js
COPY flows.js html/flows.js
COPY graphs.js html/graphs.js
COPY flow_sort.js html/flow_sort.js
COPY ui.js html/ui.js
COPY --chmod=755 nfquery.cgi html/nfquery.cgi
COPY --chmod=755 entrypoint.sh entrypoint.sh

EXPOSE 8080/tcp
EXPOSE 9995/udp

#VOLUME flow-data
#VOLUME config
#VOLUME logs

#ENTRYPOINT ["/bin/ash"]
ENTRYPOINT ["/app/entrypoint.sh"]
