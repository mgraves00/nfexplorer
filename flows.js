/*
 * Copyright
 */

class Flows {
	#_flows;			// flows array of Maps
	#_shadowflows;		// shadow of _flows array
	#_headers;			// headers array
	length;				// filtered _flows length
	sort_map = {
		'received': this.#_sortDate,
		'duration': this.#_sortFloat,
		'proto': this.#_sortNumber,
		'srcAddr': this.#_sortIP,
		'srcPort': this.#_sortNumber,
		'dstAddr': this.#_sortIP,
		'dstPort': this.#_sortNumber,
		'ttl': this.#_sortNumber,
		'icmpTYpe': this.#_sortNumber,
		'icmpCode': this.#_sortNumber,
		'packets': this.#_sortNumber,
		'bytes': this.#_sortNumber,
		'pps': this.#_sortNumber,
		'bps': this.#_sortNumber,
		'tos': this.#_sortNumber,
		'routerIP': this.#_sortIP,
	};
	#_sortDate(a,b, field) {
//		let ia = BigInt(a.get(field).valueOf());
//		let ib = BigInt(b.get(field).valueOf());
		let ia = a.get(field).getTime();
		let ib = b.get(field).getTime();
		if (ia < ib) { return -1; }
		if (ia > ib) { return 1; }
		return(0);
	}
	#_sortFloat(a,b,field) {
		let ia = parseFloat(a.get(field));
		let ib = parseFloat(b.get(field));
		if (ia < ib) { return -1; }
		if (ia > ib) { return 1; }
		return(0);
	}
	#_sortNumber(a,b, field) {
		if (parseInt(a.get(field)) < parseInt(b.get(field))) { return -1; }
		if (parseInt(a.get(field)) > parseInt(b.get(field))) { return 1; }
		return(0);
	}
	/* requires Addr Class */
	#_sortIP(a,b, field) {
		let ipa = a.get(field);
		let ipb = b.get(field);
		let na = new Addr(ipa);
		return(na.compare(ipb));
	}
	#epoch_to_date(e) {
		let a = e.split(".");
		let d = new Date(0);
		d.setUTCSeconds(a[0]);
		if (a.length == 2) d.setUTCMilliseconds(a[1]);
		return(d)
	}
	#comp_dates(a,b) {
		let aa = a.get('received');
		let bb = b.get('received');
		if (aa.getTime() < bb.getTime()) { return -1; }
		if (aa.getTime() > bb.getTime()) { return 1; }
		return(0);
	}
	constructor(unparsed_flows) {
		this._flows = Array();
		this._headers = Array();
		var flows = unparsed_flows.split("\n");
		this._headers = flows.shift().split(','); // the first row is the header
		if (flows[0] != "No matching flows") {
			flows.forEach( (flo) => {
				if (flo.length == 0) { return; }	// skip empty lines
				var rec = new Map();
				var fields = flo.split(",");
				this._headers.forEach( (h, i) => {
					if (h == "received") {
						rec.set(h, this.#epoch_to_date(fields[i]));
					} else {
						rec.set(h, fields[i]);
					}
				});
				rec.set('filter', true);
				this._flows.push(rec);
			});
			// sort in case flows were recieved out-of-order
			this._flows.sort(this.#comp_dates);
		}
		this.length = this._flows.length;
	}
	toCSV() {
		var to_ret=[];
		to_ret.push(this._headers.join(','));
		this.forEach((f) => {
			var a=[];
			this._headers.forEach((h) => {
				if (h == 'received') {
					a.push(f.get(h).valueOf());
				} else {
					a.push(f.get(h));
				}
			});
			to_ret.push(a.join(','));
		});
		return(to_ret.join('\n'));
	}
	filter(cb_fn, ...args) {
		this._flows.forEach((f) => {
			if (cb_fn(f, ...args) == false) {
				f.set('filter', false);
			}
		});
		this.length = this.#gen_length();
	}
	#gen_length() {
		let cnt = 0;
		this._flows.forEach((f)=>{ if (f.get('filter') == true) { cnt +=1; } });
		return(cnt);
	}
	reset_filter() {
		this._flows.forEach((f)=>{ f.set('filter', true); });
	}
	forEach(callbackFn, thisArg) {
		this._flows.forEach((f) => {
			if (f.get("filter") == true)
				callbackFn(f);
		});
	}
	entries() {
		var new_arr = [];
		this._flows.forEach( (f) => {
			if (f.get('filter') == true) {
				new_arr.push(f);
			}
		});
		return(new_arr);
	}
	slice(start, end) {
		console.log(`slice: ${start} ${end}`);
		var tmp_arr = [];
		var new_arr = [];
		this._flows.forEach( (f) => {
			if (f.get('filter') == true) {
				tmp_arr.push(f);
			}
		});
		new_arr = tmp_arr.slice(start,end);
		tmp_arr=[];
		return(new_arr);
	}
	find_ts(ts) {
		let i, j;
		for (i = 0,j = 0; i < this._flows.length; i++) {
			if (this._flows[i].get('filter') == false) { // skip filtered values
				continue;
			}
			let chk_ts = this._flows[i].get('received').getTime();
//			console.log(`chk_ts: ${chk_ts}\n    ts: ${ts}`);
			if (chk_ts >= ts) {
				return(j);
			}
			j += 1;
		}
		return(0);
	}
	/*
	 * functions to validate workings of class
	 */
	// validate the taht flows are in order
	_flow_out_of_order() {
		let i;
		for(i = 1; i < this._flows.length-1; i++) {
			let a = this._flows[i-1].get('received');
			let b = this._flows[i].get('received');
			if (a.getTime() > b.getTime())
				return true;
		}
		return false;
	}
	// show the "real" length of the _flow array... not the filtered one
	_length() {
		return(this._flows.length);
	}
}; // endof class FLows

async function cache_filter_cb(fld,val) {
	const fs = document.getElementById('filterstats');
	if (fs.innerHTML.includes("cached") == false) { fs.innerHTML = fs.innerHTML+" (cached)"; }
	const filter = document.getElementById('filter');
	var filter_n = ""
	switch (fld) {
		case "proto":
			filter_n = FLOW_FIELDS.get(fld).fil+" "+(PROTO_NAMES.has(val) ? PROTO_NAMES.get(val) : val);
			break;
		default:
			filter_n = FLOW_FIELDS.get(fld).fil+" "+val;
			break;
	}
	if (filter.value.length == 0) {
		filter.value = filter_n;
	} else {
		if (filter.value.includes(filter_n) == false) {
			filter.value = [filter.value, filter_n].join(" and ");
		} else {
			// no changes... just return
			return;
		}
	}
	load_flows({'field_name':fld, 'field_val': val});
}
function test_filter(flo, filter_f, filter_v) {
	if (typeof flo === 'undefined' ||
	    typeof filter_f === 'undefined' ||
	    typeof filter_v === 'undefined' ||
	    typeof filter_f.length == 0 ||
	    typeof filter_v.length == 0 ) {
		// since we don't have anything to test for... how can we fail?
		return true;
	}
	// if flow has already been filtered... just ignore
	if (flo.get('filter') == false) { return false; }
	// test the flow for inclusion
	if (flo.has(filter_f) == true && flo.get(filter_f) == filter_v) { return true; }
	// no match... exlude and return
	return false;
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
/*
 * sort the subset array by the 'by' field in the 'dir' direction
 */
function sort_subset(arr, by, dir) {
	if (FLOW_FIELDS.has(by) == false) {
		console.log('sort on unknown field');
		return(arr);
	}
	var field = FLOW_FIELDS.get(by);
	if (field.sort == undefined) {
		console.log('trying to sort unsortable field');
		return(arr);
	}
	arr.sort(field.sort);
	if (dir == "desc") {
		arr.reverse();
	}
	return(arr);
}

function sort_flows(field) {
	var flc = document.getElementById('flowlistcontainer');
	if (typeof flc === 'undefined') return;
	if (flc.dataset.sortBy == field) {	// same field... reverse sort
		flc.dataset.sortDir = (flc.dataset.sortDir == "desc" ? "asc" : "desc");
	} else {
		flc.dataset.sortBy = field;
		flc.dataset.sortDir = "asc";
	}
/*
 * XXX when caret is clicked on event returns undefined
 *
	var caret = document.querySelector(`a[data-field="${field}"] > i`);
	if (flc.dataset.sortBy == field && flc.dataset.sortDir == "asc") {
		caret.classList.remove('bi-caret-down-fill');
		caret.classList.remove('bi-caret-up-fill');
		caret.classList.add('bi-caret-down-fill');
	} else {
		caret.classList.remove('bi-caret-down-fill');
		caret.classList.remove('bi-caret-up-fill');
		caret.classList.add('bi-caret-up-fill');
	}
*/
	load_flows({'orderby': flc.dataset.sortBy, 'orderdir': flc.dataset.sortDir});
}

async function load_headers() {
	const flowlist = document.getElementById('flowlist');
	const flc = document.getElementById('flowlistcontainer');
	const thead = flowlist.getElementsByTagName('thead')[0];
	while(thead.firstChild) { thead.removeChild(thead.firstChild); } // removed all existing rows
	fields = get_checked_fields();
	fields.forEach( (f) => {
		var ff = FLOW_FIELDS.get(f);
		var fn = document.createElement("a");
		fn.dataset['field'] = f;
		fn.classList.add('btn');
		fn.classList.add('btn-primary');
		fn.classList.add('w-100');
		fn.innerHTML =  ff.desc;
/*
		var caret = document.createElement("i");
		caret.classList.add('bi');
		if (flc.dataset.sortBy == f && flc.dataset.sortDir == "asc") {
			caret.classList.add('bi-caret-down-fill');
		} else {
			caret.classList.add('bi-caret-up-fill');
		}
		fn.appendChild(caret);
*/
		if (ff.sort != undefined) {
			fn.addEventListener("click", (evt) => {
				sort_flows(evt.target.dataset.field);
				evt.preventDefault();
			});
		}
		var th = document.createElement("th");
		th.classList.add('col');
		th.classList.add('fs-5');
		th.appendChild(fn);
		thead.appendChild(th);
	});
}
async function change_page(page) {
	load_flows({'page': page});
}
async function load_flowpager(currentpage) {
	if (typeof currentpage === 'undefined') currentpage = 1;
	const fp = document.getElementById('flowpager');
	var lastpage = Math.floor(cacheflows.length / flowsperpage) + 1;
//	console.log(`currentpage: ${currentpage} lastpage: ${lastpage}`);
	while(fp.firstChild) { fp.removeChild(fp.firstChild); } // removed all existing buttons
	if (currentpage > lastpage) currentpage = lastpage;
	if (currentpage < 1) currentpage = 1;
	// start button
	var sb = document.createElement("button");
	sb.classList.add('btn');
	sb.classList.add('btn-outline-secondary');
	sb.innerHTML='<i class="bi bi-chevron-bar-left"></i>';
	if (currentpage <= 1) {
		sb.classList.add('disabled');
	} else {
		sb.addEventListener("click", (evt) => { change_page(1); });
	}
	fp.appendChild(sb)
	// prev button
	var pb = document.createElement("button");
	pb.classList.add('btn');
	pb.classList.add('btn-outline-secondary');
	pb.innerHTML='<i class="bi bi-chevron-left"></i>';
	if (currentpage < 2) {
		pb.classList.add('disabled');
	} else {
		pb.addEventListener("click", (evt) => { change_page(currentpage-1); });
	}
	fp.appendChild(pb)

	// current index
	var cb = document.createElement("input");
	cb.classList.add('form-control');
	cb.setAttribute("type", "text");
	cb.setAttribute("id", "currentpage");
	cb.value=currentpage
	cb.addEventListener("keypress", (evt) => {
		if (evt.key === "Enter") {
			evt.preventDefault();
			change_page(document.getElementById("currentpage").value);
		}
	});
	fp.appendChild(cb)

	//next button
	var nb = document.createElement("button");
	nb.classList.add('btn');
	nb.classList.add('btn-outline-secondary');
	nb.innerHTML='<i class="bi bi-chevron-right"></i>';
	if (currentpage > lastpage-1) {
		nb.classList.add('disabled');
	} else {
		nb.addEventListener("click", (evt) => { change_page(currentpage+1); });
	}
	fp.appendChild(nb)
	// end button
	var eb = document.createElement("button");
	eb.classList.add('btn');
	eb.classList.add('btn-outline-secondary');
	eb.innerHTML='<i class="bi bi-chevron-bar-right"></i>';
	if (currentpage >= lastpage) {
		eb.classList.add('disabled');
	} else {
		eb.addEventListener("click", (evt) => { change_page(lastpage); });
	}
	fp.appendChild(eb)
	
}
async function load_flows(opts) {
	if (typeof cacheflows === 'undefined') return;		// no flows to display
	var lft = Date.now();
	if (typeof opts === 'undefined') opts = { 'page': 1,
						'orderby': 'received',
						'orderdir': 'asc',
						'field_name': undefined,
						'field_val': undefined,
						'timestamp': undefined
					};
	if (typeof opts['page'] === 'undefined') opts['page'] = 1;
	if (typeof opts['orderby'] === 'undefined') opts['orderby'] = 'received';
	if (typeof opts['orderdir'] === 'undefined') opts['orderdir'] = 'asc';
	var lastpage = Math.floor(cacheflows.length / flowsperpage) + 1;	// get last page
	if (typeof opts['timestamp'] !== 'undefined') {
		let i = cacheflows.find_ts(opts['timestamp']);
		x = Math.floor(i / cacheflows.length * lastpage);
//		console.log(`i: ${i}/${cacheflows.length}  ts2p: ${x} lastpage: ${lastpage}`);
		opts['page'] = x;
	}
	cacheflows.filter(test_filter, opts['field_name'], opts['field_val']);	// filter flows if required
	if (opts['page'] > lastpage) opts['page'] = lastpage;			// check bounds for last page
	if (opts['page'] < 1) opts['page'] = 1;					// check bounds for current page
	var start = (opts['page']-1) * flowsperpage;				// get number of flows
	var offset = opts['page'] * flowsperpage;				// last flow to get

	const flowlist = document.getElementById('flowlist');
	const tbody = flowlist.getElementsByTagName('tbody')[0];
	while(tbody.firstChild) { tbody.removeChild(tbody.firstChild); }	// removed all existing rows
	load_flowpager(opts['page']);						// reload the pager controls
	var subset = cacheflows.entries();
	sort_subset(subset,opts['orderby'],opts['orderdir']);
//	var subset = cacheflows.slice(start, offset);
	subset = subset.slice(start, offset);
//	console.log(`cacheflows.length: ${cacheflows.length} subset.length: ${subset.length}`);
	subset.forEach( (flo) => {
		var tr = document.createElement("tr");
		var fields = get_checked_fields();
		fields.forEach( (fld) => {
			var td = document.createElement("td");
			td.classList.add('col');
			td.classList.add('fs-6');
			var v = flo.has(fld) ? flo.get(fld) : "";
			switch (fld) {
				case "received":
					td.innerHTML = v.toISOString();
					break;
				case "proto":
					var a = document.createElement("a");
					a.setAttribute('href','#')
					a.addEventListener('click', (evt) => {
						cache_filter_cb(fld,v);
					});
					a.innerHTML = PROTO_NAMES.has(v) ? PROTO_NAMES.get(v) : v;
					td.appendChild(a);
					break;
				default:
					var a = document.createElement("a");
					a.setAttribute('href','#')
					a.addEventListener('click', (evt) => {
						cache_filter_cb(fld,v);
					});
					a.innerHTML = v
					td.appendChild(a);
					break;
			}
			tr.appendChild(td);
		});
		tbody.appendChild(tr);
	});
	document.getElementById('flow-dropdown').classList.remove('disabled'); // enable the flow-dropdown
	subset=[];
	set_flowlistbutton(cacheflows.length);
	lft = Date.now() - lft;	
	console.log(`load_flows time: ${lft}ms`);
	// build the graph
//	build_graph();
}
async function parse_flows(csvtext) {
	var pstart = Date.now();
	var ms = pstart - searchtime;
	cacheflows = undefined;		// delete the old flows... if exists
	cacheflows = new Flows(csvtext);
	var pms = Date.now() - pstart;
	console.log(`parse records: ${pms}ms`);
	set_filterstats('returned '+cacheflows.length+" flows in "+ms+"ms");
	load_headers();
	load_flows();
	build_graph();
}

