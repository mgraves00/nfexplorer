/*
 * Copyright (c) 2026 Michael Graves
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/*
 * Class to handle IP addresses (v4 & v6) in javascript.
 * 
 */
class Addr {
	#addr;
	#bitmask;
	isIPv4;
	isIPv6;
	#m2b = ["0.0.0.0", "128.0.0.0", "192.0.0.0", "224.0.0.0", "240.0.0.0", "248.0.0.0", "252.0.0.0", "254.0.0.0",
			"255.0.0.0", "255.128.0.0", "255.192.0.0", "255.224.0.0", "255.240.0.0", "255.248.0.0",
			"255.252.0.0", "255.254.0.0", "255.255.0.0", "255.255.128.0", "255.255.192.0", "255.255.224.0", "255.255.240.0",
			"255.255.248.0", "255.255.252.0", "255.255.254.0", "255.255.255.0", "255.255.255.128", "255.255.255.192",
			"255.255.255.224", "255.255.255.240", "255.255.255.248", "255.255.255.252", "255.255.255.254", "255.255.255.255"];
	#mod2b = [ 255, 127, 63, 31, 15, 7, 3, 1 ];
	#mod2n = [ 0, 128, 192, 224, 240, 248, 252, 254 ];

	constructor(...args) {
		let atoparse=""
		let mtoparse=""
		if (args.length == 1) {
			if (args[0].indexOf('/') != -1) {
				let am = args[0].split('/');
				atoparse = am[0];
				mtoparse = am[1];
			} else {
				atoparse = args[0];
				mtoparse = "0";
			}
		} else if (args.length == 2) {
			atoparse = args[0];
			mtoparse = args[1];
		} else {
			throw Error("invalid arguments");
		}
		this.#addr = this.#_parseIP(atoparse);
		if (typeof this.#addr == 'undefined') { throw Error("cannot parse undefined"); }
		if (this.#addr.length == 4) {
			this.isIPv4 = true; this.isIPv6 = false;
		} else {
			this.isIPv4 = false; this.isIPv6 = true;
		}
		this.#bitmask = this.#_parseMask(mtoparse);
		if (typeof this.#bitmask == 'undefined') { throw Error("cannot parse undefined"); }
		if (this.isIPv4) {
			if (this.#bitmask < 0 || this.#bitmask > 32) { throw Error("bad mask"); }
		} else {
			if (this.#bitmask < 0 || this.#bitmask > 128) { throw Error("bad mask"); }
		}
	}
	#_parseMask(val) {
		if (typeof val == 'undefined') { return(undefined); }
		if (val.indexOf('.') == -1) { return(parseInt(val)); }
		let bm = this.#m2b.indexOf(val);
		if (bm == -1) { return(undefined); }
		return(bm);
	}
//XXX validate we got proper number of elements
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
			var tail = (t[1].length > 0 ? t[1].split(":") : []);
			var tail_len = tail.length;
			var filler = 8 - head_len - tail_len;
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
					parr.push(parseInt([r1,r2].join(''),16))
					parr.push(parseInt([r3,r4].join(''),16))
				}
			});
		}
		return(parr);
	}
	compare(val) {
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
		return(( this.isIPv6 == true ? 1 : -1)); // compare ipv4 and ipv6
	}
	toString(withmask=false) {
		return(this.#gen_string([...this.#addr],this.#bitmask,this.isIPv4,withmask));
	}
	#gen_string(arr, bitmask, ipv4=true, withmask=false) {
		var ips;
		if (ipv4) {
			ips = arr.join(".");
		} else {
			var s = [];
			while (arr.length > 0) {
				var r1 = arr.shift();
				var r2 = arr.shift();
				s.push([r1.toString(16).padStart(2,"0"),r2.toString(16).padStart(2,"0")].join(''));
			}
			ips = s.join(":");
		}
		if (withmask == true) {
			ips = `${ips}/${this.#bitmask}`;
		}
		return(ips);
	}
	/*
     * update address to the network address
	 */
	network() {
		var t = this.#addr;
		var mm = (this.isIPv6 ? 128 : 32) - this.#bitmask;
		for (var i = (this.isIPv6 ? 15 : 3); i > -1 && mm > 0; i--, mm-=8) {
			var cm = Math.floor(mm/8) > 0 ? 0 : (mm % 8);
			t[i] = t[i] & this.#mod2n[cm];
		}
		this.#addr = this.#_parseIP(this.#gen_string(t,this.#bitmask,this.isIPv4,false));
		return(this);
	}
	/*
     * display the netmask of the stored bitmask
	 * only works for ipv4
	 */
	netmask() {
		if (this.isIPv4) {
			return(this.#m2b[this.#bitmask]);
		}
		return("");	//IPv6 doesn't have netmask
	}
	/*
	 * display the bitmask
	 */
	bitmask() {
		return(this.#bitmask);
	}
	/*
     * update address to the broadcast address
	 */
	broadcast() {
		var t = this.#addr;
		var mm = (this.isIPv6 ? 128 : 32) - this.#bitmask;
		for (var i = (this.isIPv6 ? 15 : 3); i > -1 && mm > 0; i--, mm-=8) {
			var cm = Math.floor(mm/8) > 0 ? 0 : (mm % 8);
			t[i] = t[i] | this.#mod2b[cm];
		}
		this.#addr = this.#_parseIP(this.#gen_string(t,this.#bitmask,this.isIPv4,false));
		return(this);
	}
	/*
	 * increments the IP by offset number
	 */
	next(offset=1) {
		if (offset > 0) {
			var si = this.isIPv6 ? 15 : 3;
			for (var i = si; i > -1 && offset > 0; i--) {
				this.#addr[i] += offset;
				if (this.#addr[i] > 255) {
					offset = this.#addr[i] - 255;
					this.#addr[i] -= 256;
				} else {
					offset = 0;
				}
			}
		}
		return(this);
	}
	/*
	 * decrements the IP by offset number
	 */
	prev(offset=1) {
		if (offset > 0) {
			offset = offset * -1;
			var si = this.isIPv6 ? 15 : 3;
			for (var i = si; i > 0 && offset < 0; i--) {
				this.#addr[i] += offset;
				if (this.#addr[i] < 0) {
					offset = 0 - this.#addr[i];
					this.#addr[i] += 256;
					if (i == 0) { // ran out of numbers... abort
						return(undefined);
					}
					this.#addr[i-1]--;
					if (this.#addr[i-1] < 0) {
						this.#addr[i-1] = 255;
						offset = -256;
					}
				} else {
					offset = 0;
				}
			}
		}
		return(this);
	}
	/*
	 * sets the address to the first usable address + offset
	 */
	first(offset=1) {
		return(this.network().next(offset));
	}
	/*
	 * sets the address to the last usable address - offset
	 */
	last(offset=1) {
		return(this.broadcast().prev(offset));
	}
};

