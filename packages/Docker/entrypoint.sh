#!/bin/ash

NFCAPD_USER=${NFCAPD_USER:-root}
NFCAPD_GROUP=${NFCAPD_GROUP:-nginx}
NFCAPD_LISTEN=${NFCAPD_LISTEN:-9995}
NFCAPD_BUFSIZE=${NFCAPD_BUFSIZE:-200000}
NFCAPD_INTERVAL=${NFCAPD_INTERVAL:-300}
NFCAPD_FLOWDIR=${NFCAPD_FLOWDIR:-/app/flow-data}

# start nfcapd
/usr/bin/nfcapd -D -p ${NFCAPD_LISTEN} \
	-u ${NFCAPD_USER} -g ${NFCAPD_GROUP} \
	-B ${NFCAPD_BUFSIZE} \
	-S 1 -t ${NFCAPD_INETRVAL} \
	-z=lz4 -M ${NFCAPD_FLOWDIR}

# 
if [ ! -f /app/config/nginx.conf ]; then
	cp /app/nginx.conf.dist /app/config/nginx.conf
	chown nginx:nginx /app/config/nginx.conf
fi
if [ ! -f /app/config/nfquery.env ]; then
	cp /app/nfquery.env.dist /app/config/nfquery.env
	chown nginx:nginx /app/config/nfquery.env
fi

# start  nginx
#
