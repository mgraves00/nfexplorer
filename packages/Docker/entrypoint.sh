#!/bin/ash

NFCAPD_ENABLE=${NFCAPD_ENABLE:-no}
NFCAPD_USER=${NFCAPD_USER:-nginx}
NFCAPD_GROUP=${NFCAPD_GROUP:-nginx}
NFCAPD_LISTEN=${NFCAPD_LISTEN:-9995}
NFCAPD_BUFSIZE=${NFCAPD_BUFSIZE:-200000}
NFCAPD_INTERVAL=${NFCAPD_INTERVAL:-300}
NFCAPD_FLOWDIR=${NFCAPD_FLOWDIR:-/app/flow-data}

echo "NFCAPD_ENABLE=${NFCAPD_ENABLE}"
echo "NFCAPD_USER=${NFCAPD_USER}"
echo "NFCAPD_GROUP=${NFCAPD_GROUP}"
echo "NFCAPD_LISTEN=${NFCAPD_LISTEN}"
echo "NFCAPD_BUFSIZE=${NFCAPD_BUFSIZE}"
echo "NFCAPD_INTERVAL=${NFCAPD_INTERVAL}"
echo "NFCAPD_FLOWDIR=${NFCAPD_FLOWDIR}"

echo -n "fixup perms on ${NFCAPD_FLOWDIR}..."
chown -R ${NFCAPD_USER}:${NFCAPD_GROUP} ${NFCAPD_FLOWDIR}
echo "done."
# start nfcapd
if [ ! -z "${NFCAPD_ENABLE}" -a "${NFCAPD_ENABLE}" == "yes" ]; then
	echo -n "starting nfcapd..."
	/usr/bin/nfcapd -D -p ${NFCAPD_LISTEN} \
		-u ${NFCAPD_USER} -g ${NFCAPD_GROUP} \
		-B ${NFCAPD_BUFSIZE} \
		-z=lz4 -t ${NFCAPD_INTERVAL} \
		-S 1 -M ${NFCAPD_FLOWDIR}

	if [ $? -eq 0 ]; then
		echo "started."
	else
		echo "failed."
	fi
fi
# start fcgiwrap
echo -n "starting fcgiwrap..."
/usr/bin/fcgiwrap -c 10 -s tcp:127.0.0.1:9000 &
echo "done"

# check for configs
if [ ! -f /app/config/nginx.conf ]; then
	cp /app/nginx.conf.dist /app/config/nginx.conf
	chown nginx:nginx /app/config/nginx.conf
fi
if [ ! -f /app/config/nfquery.env ]; then
	cp /app/nfquery.env.dist /app/config/nfquery.env
	chown nginx:nginx /app/config/nfquery.env
fi

# start  nginx
echo "starting nginx..."
/usr/sbin/nginx -p /app -c /app/config/nginx.conf -g 'daemon off;'
#/usr/sbin/nginx -p /app -c /app/config/nginx.conf
echo "nginx exited: $?"

# nginx exited

# stop nfcapd
echo -n "Stopping nfcapd..."
pkill nfcapd
echo "done."

# stop fcgiwrap
echo -n "Stopping fcgiwrap..."
pkill fcgiwrap
echo "done."
