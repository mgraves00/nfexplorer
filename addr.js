/*
 * copyright
 */
class Addr {
	#addr;
	isIPv4;
	isIPv6;
	constructor(val) {
		this.#addr = this.#_parseIP(val);
		if (this.#addr.length == 4) {
			this.isIPv4 = true;
			this.isIPv6 = false;
		} else {
			this.isIPv4 = false;
			this.isIPv6 = true;
		}
	}
	#_parseIP(val) {
		var parr = [];
		var segs = [];
		if (typeof val == 'undefined') { return(undefined); }
		if (val.indexOf(":") == -1) {
			segs = val.split('.');
			segs.forEach((s) => {
				parr.push(parseInt(s));
			});
		} else {
			var t = val.split("::");
			var head = t[0].split(":");
			var head_len = head.length;
			var tail = (t.length > 1 ? t[1].split(":") : []);
			var tail_len = tail.length;
			var filler = 8 - head_len - tail_len;
//			console.log(`head_len ${head_len}\ntail_len ${tail_len}\nfilller ${filler}`);
			head.forEach((v) => {
				var x = v.split('');
				while (x.length > 0) {
					var r4 = x.pop();
					var r3 = x.pop() || "0";
					var r2 = x.pop() || "0";
					var r1 = x.pop() || "0";
					parr.push(parseInt([r1,r2].join(''),16))
					parr.push(parseInt([r3,r4].join(''),16))
				}
			});
			for (var l = 0; l < filler; l++) {
				parr.push(parseInt(0));
				parr.push(parseInt(0));
			}
			tail.forEach((v) => {
				var x = v.split('');
				while (x.length > 0) {
					var r4 = x.pop();
					var r3 = x.pop() || "0";
					var r2 = x.pop() || "0";
					var r1 = x.pop() || "0";
//					console.log(`${r1} ${r2} ${r3} ${r4}`);
					parr.push(parseInt([r1,r2].join(''),16))
					parr.push(parseInt([r3,r4].join(''),16))
				}
			});
		}
		return(parr);
	}
	toString() {
		var s = [];
		if (this.isIPv4) {
			return(this.#addr.join("."));
		} else {
			var x = this.#addr;
			while (x.length > 0) {
				var r1 = x.shift();
				var r2 = x.shift();
				s.push([r1.toString(16).padStart(2,"0"),r2.toString(16).padStart(2,"0")].join(''));
			}
			return(s.join(":"));		
		}
	}
	compare(val) {
//		console.log(`testing val ${val}`);
		if (typeof val == 'undefined' || val.length <= 0) { return(0) };
		var caddr = this.#_parseIP(val);
		if (typeof caddr == 'undefined') { return(0) };
		if ((this.isIPv4 && (caddr.length == 4)) ||
			(this.isIPv6 && (caddr.length == 16))) {
			for(var i = 0; i < (this.isIPv4 ? 4 : 16); i++) {
				if (this.#addr[i] < caddr[i]) { return(-1); }
				if (this.#addr[i] > caddr[i]) { return(1); }
			}
			return(0);
		}
		// compare ipv4 and ipv6
		return(( this.isIPv6 == true ? 1 : -1));
	}
};

