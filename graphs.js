/*
 * Copyright
 */

function fixup_date(d) {
	return(d);
/*
	return(
		d.getUTCFullYear()+"/"+
		Number(d.getUTCMonth()+1).toString().padStart(2,"0")+"/"+
		d.getUTCDay().toString().padStart(2,"0")+" "+
		d.getUTCHours().toString().padStart(2,"0")+":"+
		d.getUTCMinutes().toString().padStart(2,"0")+":"+
		d.getUTCSeconds().toString().padStart(2,"0")
		+"."+
		d.getUTCMilliseconds().toString()
	);
*/
}
function compare_date(a,b) {
	const v = (a.getTime() === b.getTime());
	if (a.getTime() > b.getTime())
		console.error(`dates go backwards: ${a.getTime()} > ${b.getTime()}`);
	return(v);
}
/*
 * dygraph data expect one timestamp per record. netflow records can have
 * the same timestamp.  This function will add up the fields if the timestamps
 * match.
 */
function gen_graph_data() {
	if (typeof cacheflows === 'undefined') return([]);
	var stacktype = get_stack_type();
	var stackby = get_stack_by();

	console.log(`gen_graph_data: type=${stacktype} by=${stackby}`);
	var data = new Array();
	var fields = ["Date"];
	if (stacktype != 'stacked')
		fields.push('All');
	cacheflows.forEach((f) => {
		var idx = 1;
		var t = [];
		var name = "";
		if (stacktype == 'stacked') {
			switch (stackby) {
				case "proto":
					name = PROTO_NAMES.has(f.get(stackby)) ? PROTO_NAMES.get(f.get(stackby)) : f.get(stackby);
					break;
				default:
					name = f.get(stackby);
			}
			idx = fields.indexOf(name);
			if (idx == -1) {
				fields.push(name);
				idx = fields.indexOf(name);
			}
		}
//			var t = [fixup_date(f.get('received')),Number(f.get('bytes')),Number(f.get('packets'))];
		t[0] = fixup_date(f.get('received'));
		t[idx] = Number(f.get('bytes'));
		if (data.length > 0 && compare_date(data[data.length-1][0],t[0]) == true) {
			// times match... just add together
			if (data[data.length-1][idx] == undefined) {
				data[data.length-1][idx] = t[idx];
			} else {
				data[data.length-1][idx] += t[idx];
			}
//				data[data.length-1][2] += t[2];
		} else {
			// times don't match... push a new value
			data.push(t);
		}
	});
	/*
	 * the data array is not filled with holes.  go thru the array and fill in any holes with 0
	 */
	data.map((x) => {
		for (var i=1; i<fields.length; i++)
			if (typeof x[i] === 'undefined')
				x[i] = 0;
	});
//	console.log(`gen_graph_data: fields: ${fields} value: ${data.length}`);
	return({'labels': fields, 'values': data})
}
function graph_zoom(mints, maxts, points) {
	load_flows({'timestamp': mints });
}
function graph_click(evt, ts, point) {
	load_flows({'timestamp': ts });
}
/*
 * retrun true if graph element is visible
 */
function graph_visible() {
	const e = document.getElementById('graphdata');
	if ( typeof e === 'undefined' ) return false;
	return (e.classList.entries().toArray().flat().includes('show'))
}
/* sort the list of legends.  the is in reverse order */
function legend_sort_y(a,b) {
	if (a.visible == false) { return(1); }	// if the data is not visible... send it to the end
	if (a.y > b.y) { return(-1) };
	if (a.y < b.y) { return(1) };
	return(0);
}
function get_graph_top_n() {
	var gtnv = document.getElementById('graph-top-n').value || 10;
	return(gtnv);	
}
function graph_legend_formatter(data) {
	let ret = "";
	var series = data.series.sort(legend_sort_y);
	var gtn = get_graph_top_n();
	var top_n = series.slice(0, gtn);
	if (series.length > gtn+1) {
		var tot = 0;
		series.slice(gtn).map((v) => { tot += v.y; });
		top_n[top_n.length-1] = {
			'label': "Other",
			'visible': true,
			'color': "rgb(255,255,255)",
			'y': tot,
			'yHTML': tot,
		};
	}
	if (data.x == null) {
		ret = "<br/>" + top_n.map(v => `<div class="row"><div class="col" style="color: ${v.color};">${v.label}</div></div>`).join('');
	} else {
		ret = data.xHTML + "<br/>" + top_n.map(v => `<div class="row"><div class="col" style="color: ${v.color};">${v.label}:</div><div class="col">${v.yHTML}</div></div>`).join('');
	}
	return(ret);
}
function get_stack_by() {
	var gsl = document.getElementById('graph-stack-by');
	if (typeof gsl === 'undefined') { return(false); }
	var rbs = gsl.querySelectorAll('input[name="graph-by"]');
	for (var b = 0; b < rbs.length; b++) {
		if (rbs[b].checked == true)
			return(rbs[b].value);
	}
	return("");
}
/*
 * return value of checked button
 */
function get_stack_type() {
	var gsl = document.getElementById('graph-stack-type');
	if (typeof gsl === 'undefined') { return(false); }
	var rbs = gsl.querySelectorAll('input[name="graph-type"]');
	if (rbs.length != 2) { return(false); }
	if (rbs[0].checked == true) {
		return(rbs[0].value);
	}
	return(rbs[1].value);
}
/*
 * function to build the current graph.
 * should be called whenever the data is refreshed.
 */
async function build_graph(gtype) {
	console.log("build_graph: called");
	if (typeof cacheflows === 'undefined') return;
	if (typeof gtype === "undefined") gtype = "flows";
	const go = document.getElementById('graphoutput');
	if ( typeof go === 'undefined') {
		console.error("build_graph: could not find '#graphoutput' element");
		return;
	}
	if (graph_visible() == false) {
		console.log("build_graph: element hidden. aborting");
		return;
	}
	var stype = get_stack_type();
	var stackedby = get_stack_by();
	var data = gen_graph_data();
	if (data.values.length == 0) {
		console.log("no data to graph");
		return;
	} else {
		console.log(`graphing ${data.values.length} points`);
	}
	var dyconfig = {};
	if (typeof dygraph === 'undefined') {
		dyconfig = {
//BUG: when specified. zoom doesnt work first time
//			dateWindow: [data.values[0][0], data.values[data.values.length-1][0]], // set the date window to the all flows
			connectSeparatedPoints: true,
			labels: data.labels,
			legend: 'always',
			xlabel: "Time",
			ylabel: "Bytes/s",
//			y2label: "Packets/s",
			labelsDiv: 'graphlegend',
			strokeWidth: 1,
			stackedGraph: (stype == 'stacked' ? true : false),
			labelsSeparateLines: true,
			legendFormatter: graph_legend_formatter,
			clickCallback: graph_click,
			zoomCallback: graph_zoom,
			highlightCircleSize: 3,
			labelsKMG2: true,
			fillGraph: true,
/*
			highlightSeriesOpts: {
				strokeWidth: 3,
				strokeBorderWidth: 1,
				highlightCircleSize: 5,
				highlightSeriesBackgroundAlpha: 1,
			},
*/


/*
			axes: {
				y: {
					logscale: false,
					fillGraph: true,
					labelsKMG2: true,
				},
				y2: {
//					drawAxis: true,
//					logscale: true,
					fillGraph: false,
					labelsKMB: true,
				}
			},
*/
/*
			series: {
				'Bytes': {
//					highlightSeriesBackgroundColor: "rgb(128,128,128)",
//					highlightSeriesBackgroundAlpha: 0.0,
					highlightCircleSize: 5,
				},
				'Packets': {
//					highlightSeriesBackgroundAlpha: 1.0,
					highlightCircleSize: 3,
				},
			},
*/
/*
				strokeWidth: 2,
				strokeBorderWidth: 1,
				highlightCircleSize: 5,
				highlightSeriesBackgroundAlpha: 0.0,
//				highlightSeriesBackgroundColor: rgb(128,128,128),
			},
*/
//			resizable: true,
//			labelsKMB: true,
//			showRangeSelector: true,
//			labelsSeparateLines: true,
//			stepPlot: true,
//			zoneCallback: graph_zoom,
//			clickCallback: graph_click,
//			rangeSelectorAlpha: 0.3,
//			rangeSelectorForegroundStrokeColor: "yellow",
//			rangeSelectorPlotStrokeColor: '#888888',
//			rangeSelectorPlotFillColor: '#cccccc',
		};
		dygraph = new Dygraph(go, data.values, dyconfig);
	} else {
		dyconfig = {
			labels: data.labels,
			stackedGraph: (stype == 'stacked' ? true : false),
			file: data.values,
//BUG: when specified. zoom doesnt work first time
//			dateWindow: [data.values[0][0], data.values[data.values.length-1][0]], // reset the date window
		};
		dygraph.updateOptions(dyconfig);
	}
	dygraph.updateOptions(dyconfig);
}

async function update_graph_top_n() {
	build_graph();
}


