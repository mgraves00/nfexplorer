/*
 * Copyright
 */


function sort_received(a,b) { return sortDate(a,b,"received"); }
function sort_duration(a,b) { return sortFloat(a,b,"duration"); }
function sort_proto(a,b) { return sortNumber(a,b,"proto"); }
function sort_srcAddr(a,b) { return sortIP(a,b,"srcAddr"); }
function sort_srcPort(a,b) { return sortNumber(a,b,"srcPort"); }
function sort_dstAddr(a,b) { return sortIP(a,b,"dstAddr"); }
function sort_dstPort(a,b) { return sortNumber(a,b,"dstPort"); }
function sort_ttl(a,b) { return sortNumber(a,b,"ttl"); }
function sort_icmpTYpe(a,b) { return sortNumber(a,b,"icmpTYpe"); }
function sort_icmpCode(a,b) { return sortNumber(a,b,"icmpCode"); }
function sort_packets(a,b) { return sortNumber(a,b,"packets"); }
function sort_bytes(a,b) { return sortNumber(a,b,"bytes"); }
function sort_pps(a,b) { return sortNumber(a,b,"pps"); }
function sort_bps(a,b) { return sortNumber(a,b,"bps"); }
function sort_tos(a,b) { return sortNumber(a,b,"tos"); }
function sort_agent(a,b) { return sortIP(a,b,"routerIP"); }
// sort functions
function sortDate(a,b, field) {
	var ia = BigInt(a.get(field).valueOf());
	var ib = BigInt(b.get(field).valueOf());
	if (ia < ib) { return -1; }
	if (ia > ib) { return 1; }
	return(0);
}
function sortFloat(a,b,field) {
	var ia = parseFloat(a.get(field));
	var ib = parseFloat(b.get(field));
	if (ia < ib) { return -1; }
	if (ia > ib) { return 1; }
	return(0);
}
function sortIP(a,b, field) {
	var ipa = a.get(field);
	var ipb = b.get(field);
	var na = new Addr(ipa);
	return(na.compare(ipb));
}
function sortNumber(a,b, field) {
//	console.log(`sortNumber: ${field}`);
	if (parseInt(a.get(field)) < parseInt(b.get(field))) { return -1; }
	if (parseInt(a.get(field)) > parseInt(b.get(field))) { return 1; }
	return(0);
}

