#!/bin/ksh

#_CGI_header=
_CGI_sent_header=0
_prepare_qs=0
_saved_QUERY_STRING=""

NFDUMP=`which nfdump`
SED=`which sed`
XARGS=`which xargs`
DATE=`which date`
TR=`which tr`
PRINTF=`which printf`
UNAME=`which uname`

function find_env {
	LIST="/app/config/nfquery.env /etc/nfquery.env .nfquery.env"
	for f in ${LIST} ; do
		if [ -f "$f" ]; then
			echo $f
			return
		fi
	done
	echo ""
	return
}

function urldecode {
	local _e=$1
	if [ -z "${_e}" ]; then
		echo ""
		return 1
	fi
	echo -n ${_e} | ${SED} -e 's@+@ @g; s@%@\\x@g;' | ${XARGS} -0 ${PRINTF} "%b"
	return 0
}

function print_header {
	local _i
	if [ `is_cgi` -eq 0 ]; then
		return 0
	fi
	if [ ${_CGI_sent_header} -ne 0 ]; then
		# already sent
		return 1
	fi
	for _i in "${_CGI_header[@]}"; do
		${PRINTF} "${_i}\r\n"
	done
	${PRINTF} "\r\n"
	_CGI_send_header=1
	return 0
}

function add_header {
	local _k=$1; shift
	local _v=$*
	local _h
	if [ ${_CGI_sent_header} -eq 1 ]; then
		# already sent
		return 1
	fi
	if [ -z "${_k}" -o -z "${_v}" ]; then
		# noting to do
		return 1
	fi
	_h="${_k}: ${_v}"
	_CGI_header[${#_CGI_header[@]}]=$_h
	return 0
}

function is_cgi {
	if [ -z "$REQUEST_METHOD" -o $REQUEST_METHOD == "CGI" ]; then
		echo 0
		return 0
	fi
	echo 1
	return 1
}

function prepare_query_string {
	local _args=$*
	if [ -z "$REQUEST_METHOD" ]; then
		REQUEST_METHOD=CGI
	fi
	case "$REQUEST_METHOD" in
		"GET")
			_saved_QUERY_STRING=$QUERY_STRING
			;;
		"POST")
			if [ ! -z "$CONTENT_LENGTH" -a "$CONTENT_LENGTH" -gt 0 ]; then
#				read -N $CONTENT_LENGTH -u 0 POST_DATA
				read POST_DATA
				_saved_QUERY_STRING=$POST_DATA
			fi
			;;
		"CGI")
			_saved_QUERY_STRING="$_args"
			;;
		*)
			;;

	esac
	# sometimes the query string can be sent with spaced... if so, convert to +.
	_saved_QUERY_STRING=`echo $_saved_QUERY_STRING | ${TR} ' ' '+'`
	_prepare_qs=1
	return 0
}

function query_value {
	local OFIS
	local ARGS
	local i
	if [ $# -eq 0 ]; then
		echo ""
		return 1
	fi
	if [ $_prepare_qs -ne 1 ]; then
		# need to call prepare_query_string first
		echo ""
		return 2
	fi
	if [ -z "$_saved_QUERY_STRING" ]; then
		# nothing to lookup
		echo ""
		return 1
	fi
	local _key=$1
	local _val=""
	OIFS=$IFS
	IFS="$IFS&"
	set $_saved_QUERY_STRING
	ARGS=$*
	IFS=$OIFS
	for i in $ARGS; do
		IFS="$OIFS="
		set $i
		IFS="$OIFS"
		case $1 in
			${_key})
				_val=`urldecode "$2"`
				echo ${_val}
				IFS=$OIFS
				return 0
				;;
		esac
	done
	IFS=$OIFS
	echo ""
	return 1
}

function build_filter {
	local _fil="ipv4"
	local _v
	local vars="protocol srcaddr srcport dstaddr dstport"
	set $vars
	while [ $# -ne 0 ]; do
		case $1 in
		protocol)
			_v=`query_value $1`
			if [ ! -z "$_v" ]; then
				_fil="${_fil} and proto ${_v}"
			fi
			shift ;;
		srcaddr)
			_v=`query_value $1`
			if [ ! -z "$_v" ]; then
				_fil="${_fil} and src ip ${_v}"
			fi
			shift ;;
		srcport)
			_v=`query_value $1`
			if [ ! -z "$_v" ]; then
				_fil="${_fil} and src port = ${_v}"
			fi
			shift ;;
		dstaddr)
			_v=`query_value $1`
			if [ ! -z "$_v" ]; then
				_fil="${_fil} and dst ip ${_v}"
			fi
			shift ;;
		dstport)
			_v=`query_value $1`
			if [ ! -z "$_v" ]; then
				_fil="${_fil} and dst port = ${_v}"
			fi
			shift ;;
		esac
	done

	echo "$_fil"
	return 0
}

function gen_epoch {
	local _val=`${DATE} +"%s"`
	echo $_val
}

function gen_date {
	local _epoch=$1; shift
	local _fmt=$*
	_val=""
	case "$(${UNAME})" in
	'OpenBSD')
		_val=`${DATE} -j -r${_epoch} +"$_fmt"`
		;;
	'Linux')
		_val=`${DATE} -d @${_epoch} +"$_fmt"`
		;;
	*)
		_val=`${DATE} -r${_epoch} +"$_fmt"`
		;;
	esac
	echo $_val
}


### TODO
# Add -O order option
# Add -c Limit number of records
# Add -a/-A/-b/-B aggregation option
# Add -D nameserver lookup
# Add -G geoDB lookup
# Add -s statistics
#   - can return json
# Add -N for human readable vs raw number... probably just when displaying text


## MAIN
ENV=$(find_env)
if [ ! -z "${ENV}" -a -f "${ENV}" ]; then
	. ${ENV}
fi
if [ -z "${FLOW_DIR}" -o ! -d "${FLOW_DIR}" ]; then
	echo "error: FLOW_DIR not found"
	exit 1
fi
prepare_query_string "$*"

# generate time range
reltime=`query_value "reltime"`
if [ -z "${reltime}" ]; then
	starttime=`query_value "starttime"`
	endtime=`query_value "endtime"`
	if [ -z "${starttime}" -o -z "${endtime}" ]; then
		endtime=`gen_epoch`
		starttime=$((endtime - 60))
	fi
else
	reltime=$((reltime * 60))
	endtime=`gen_epoch`
	starttime=$((endtime - ${reltime}))
fi
starttime=`gen_date ${starttime} "%Y/%m/%d.%H:%M:%S"`
endtime=`gen_date ${endtime} "%Y/%m/%d.%H:%M:%S"`
TIMERANGE="-t ${starttime}-${endtime}"

OUTPUT_FMT="csv:%trr,%td,%ra,%pr,%sa,%sp,%da,%dp,%it,%ic,%pkt,%byt,%pps,%bps,%flg,%tos"

add_header "Content-type" "application/text"
print_header

flow_args="-q -r ${FLOW_DIR}"
filter=`query_value "filter"`
if [ $? -ne 0 ]; then
	filter=`build_filter`
fi

#echo "${NFDUMP} $flow_args ${TIMERANGE} -o \"${OUTPUT_FMT}\" \"$filter\"" >> /tmp/query.log
${NFDUMP} $flow_args ${TIMERANGE} -o "${OUTPUT_FMT}" "$filter"

