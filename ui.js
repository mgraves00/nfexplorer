/*
 * Copyright
 */

// set search button loading spinner
function set_loading() {
	elements = document.getElementById("flowsearch").children;
	elements[0].classList.add("visually-hidden");
	elements[1].classList.remove("visually-hidden");
}
// clear search button loading spinner
function clear_loading() {
	elements = document.getElementById("flowsearch").children;
	elements[0].classList.remove("visually-hidden");
	elements[1].classList.add("visually-hidden");
}
function set_time_type() {
	var opt = document.getElementById('timetype').value
	if ( opt == "range" ) {
		document.getElementById('relativetimeselect').classList.add('d-none');
		document.getElementById('rangetimeselect').classList.remove('d-none');
	} else {
		document.getElementById('relativetimeselect').classList.remove('d-none');
		document.getElementById('rangetimeselect').classList.add('d-none');
	}
}
// human time to seconds
function human_to_sec(val) {
	const re = /(\d+)([hdwm]?)/gm;
	const arr = re.exec(val);
	var ret = 0;
	if (arr[2] == "h" ) {
		ret = arr[1] * 3600;
	} else if (arr[2] == "d" ) {
		ret = arr[1] * 3600 * 24;
	} else if (arr[2] == "w" ) {
		ret = arr[1] * 3600 * 24 * 7;
	} else if (arr[2] == "m" ) {
		ret = arr[1] * 3600 * 24 * 30;
	} else {
		ret = arr[1] * 60;
	}
	return(ret);
}
function get_checked_fields() {
	const fdd = document.getElementById('fieldsdropdown');
	var ret = new Array();
	var cbs = fdd.getElementsByClassName('form-check-input');
	for (var c = 0; c < cbs.length; c++) {
		if (cbs.item(c).checked) {
			ret.push(cbs.item(c).value);
		}
	};
	return(ret);
}
async function action_download_flows() {
	var data = cacheflows.toCSV();
	var blob = new Blob([data], { type: 'text/csv' });
	var url = URL.createObjectURL(blob);
	var a = document.createElement('a');
	a.href = url;
	a.download = "nfexplorer.csv";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
	blob=undefined;
	data=undefined;
}
async function action_copy_link() {
	console.log("action_copy_link clicked");
	var link=[];
	var opt = document.getElementById('timetype').value
	link.push(`timetype=${opt}`);
	if ( opt == "relative" ) {
		var ts = document.getElementById('relativetime').value;
		link.push(`range=${ts}`);
	} else {
		var st = Math.floor(Date.parse(
			document.getElementById('startdate').value+" "+
			document.getElementById('starttime').value
		).valueOf() / 1000);
		var et = Math.floor(Date.parse(
			document.getElementById('enddate').value+" "+
			document.getElementById('endtime').value
		).valueOf() / 1000);
		link.push(`starttime=${st}`);
		link.push(`endtime=${et}`);
	}
	var filter=document.getElementById('filter').value;
	link.push(`filter=${filter}`);
	var link_str = window.location.origin+window.location.pathname+'?'+encodeURI(link.join('&'));

	navigator.clipboard.writeText(link_str)
		.then(() => {
			console.log(link_str);
			send_user_message('Link Copied...', 'alert-success', 1500);
		})
		.catch(err => {
			console.error('failed to copy link text', err);
		});
}
async function send_user_message(msg, type, to_ms) {
	var mb = document.createElement('div');
	mb.setAttribute('id', 'action-copied-message');
	mb.setAttribute('role', 'alert');
	mb.classList.add('z-3');
	mb.classList.add('position-absolute');
	mb.classList.add('top-0');
	mb.classList.add('end-0');
	mb.classList.add('alert');
	mb.classList.add(type);
	mb.innerHTML=msg;
	document.body.appendChild(mb);
	setTimeout(() => {
		var mb = document.getElementById('action-copied-message');
		if (typeof mb === 'undefined') return;
		document.body.removeChild(mb);
	}, to_ms);
}

/*
function comp_flow(a, b) {
	if (a[0].getTime() < b[0].getTime())
		return -1;
	if (a[0].getTime() > b[0].getTime())
		return 1;
	return 0;
}
*/
async function set_filterstats(value) {
	const filterstats = document.getElementById('filterstats');
	filterstats.innerHTML = value;
}
async function set_flowlistbutton(val) {
	if (typeof val === 'undefined') {
		val = "???";
	}
	const flb = document.getElementById('flowlistbutton');
	flb.innerHTML="Flows ("+val+")";
}
async function send_search() {
	set_filterstats('loading...');
	set_loading();
	var data=[];
	var tt = document.getElementById('timetype').value;
	data.push("timetype="+tt);
	if (tt == "relative") {
		ts = Number(human_to_sec(document.getElementById('relativetime').value));
		nts = Math.floor(ts / 60); // get minutes
		data.push("reltime="+nts);
	} else {
		st = Math.floor(Date.parse(
			document.getElementById('startdate').value+" "+
			document.getElementById('starttime').value
		).valueOf() / 1000);
		et = Math.floor(Date.parse(
			document.getElementById('enddate').value+" "+
			document.getElementById('endtime').value
		).valueOf() / 1000);
		data.push("starttime="+st);
		data.push("endtime="+et);
	}
	data.push("filter="+document.getElementById('filter').value);
	query = new XMLHttpRequest();
	query.onload = function() {
		if (query.readyState === 4) {
			if (query.status === 200) {
				parse_flows(this.responseText);
			} else {
				console.error(query.statusText);
			}
			clear_loading()
		}
	}
	query.onerror = () => {
		console.error(query.statusText);
		clear_loading()
	};
	query.ontimeout = () => {
		console.error("requet timeout");
		clear_loading()
	};
	searchtime = Date.now();
	query.open("POST", "nfquery.cgi", true);
	query.send(data.join("&"));
}
/*
 * read the window.location... if there is a query parse it
 * and setup the flow search fields accordingly.  then call
 * send_search()
 */
async function process_search_query() {
	if (window.location.search == "") { return; }
	var search = decodeURI(window.location.search).split('?')[1];
	var opts = search.split('&');
	var valid_val = true;
	opts.forEach(o => {
		var kv = o.split('=',2);
		switch (kv[0]) {
			case 'timetype':
				var el = document.getElementById(kv[0]);
				if (typeof el === 'undefined') { return; }
				el.value = (kv[1] == 'relative') ? "relative" : "range";
				break;
			case 'relative':
				var el = document.getElementById('relativetime');
				if (typeof el === 'undefined') { return; }
				el.value = kv[1] || 5;
				break;
			case 'starttime':
				var nd = new Date(0);
				nd.setTime(kv[1]+"000");
				el = document.getElementById('startdate');
				if (typeof el === 'undefined') { return; }
				el.value = [nd.getFullYear(),
							Number(nd.getMonth()+1).toString().padStart(2,"0"),
							Number(nd.getDate()).toString().padStart(2,"0")
						].join('-');
				el = document.getElementById('starttime');
				if (typeof el === 'undefined') { return; }
				el.value = [Number(nd.getHours()).toString().padStart(2,"0"),
							Number(nd.getMinutes()).toString().padStart(2,"0"),
							Number(nd.getSeconds()).toString().padStart(2,"0")
						].join(':');
				break;
			case 'endtime':
				var nd = new Date(0);
				nd.setTime(kv[1]+"000");
				var el = document.getElementById('enddate');
				if (typeof el === 'undefined') { return; }
				el.value = [nd.getFullYear(),
							Number(nd.getMonth()+1).toString().padStart(2,"0"),
							Number(nd.getDate()).toString().padStart(2,"0")
						].join('-');
				el = document.getElementById('endtime');
				if (typeof el === 'undefined') { return; }
				el.value = [Number(nd.getHours()).toString().padStart(2,"0"),
							Number(nd.getMinutes()).toString().padStart(2,"0"),
							Number(nd.getSeconds()).toString().padStart(2,"0")
						].join(':');
				break;
			case 'filter':
				var el = document.getElementById(kv[0]);
				if (typeof el === 'undefined') { return; }
				el.value = kv[1] || "";
				break;
			default:
				valid_vals = false;
		}
	});
	if (valid_vals)
		send_search();
}

