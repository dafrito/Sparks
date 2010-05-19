Sparks.add_initializer("Algorithm Validator", function algorithm_validator() {
	if(Sparks.debug)
		Sparks.log("Skipping algorithm tests.");
	return;

	// MD5 One Block
	assert(Sparks.Algorithm.hexdigest(Sparks.Algorithm.md5("abc")) ===
		"900150983cd24fb0d6963f7d28e17f72",
		"Sparks.Algorithm: Failed validation - MD5 with 'abc'"
	);	

	// SHA-1 One block
	assert(
		Sparks.Algorithm.hexdigest(Sparks.Algorithm.sha1("abc")) ===
		"a9993e364706816aba3e25717850c26c9cd0d89d",
		"Sparks.Algorithm: Failed validation - SHA-1 with 'abc'"
	);	

	// SHA-1 multi-block
	assert(Sparks.Algorithm.hexdigest(Sparks.Algorithm.sha1(
			"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
		)) ===
		"84983e441c3bd26ebaae4aa1f95129e5e54670f1",
		"Sparks.Algorithm: Failed validation - SHA-1 multi-block test"
	);

/*
	// Commented out because this one takes awhile.
	var msg = "";
	while(msg.length < 1000000) {	
		msg += "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" + msg;
	}

	msg = msg.substr(0, 1000000);

	// SHA-1 long message
	assert(Sparks.Algorithm.hexdigest(Sparks.Algorithm.sha256(msg)) ===
		"34aa973cd4c4daa4f61eeb2bdbad27316534016f",
		"Sparks.Algorithm: Failed validation - SHA-1 long message test"
	);

	// SHA-256 long message
	assert(Sparks.Algorithm.hexdigest(Sparks.Algorithm.sha256(msg)) ===
		"cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0",
		"Sparks.Algorithm: Failed validation - SHA-256 long message test"
	);
*/

	// SHA-256 One block
	assert(
		Sparks.Algorithm.hexdigest(Sparks.Algorithm.sha256("abc")) ===
		"ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
		"Sparks.Algorithm: Failed validation - SHA-256 with 'abc'"
	);

	// SHA-256 multi-block
	assert(Sparks.Algorithm.hexdigest(Sparks.Algorithm.sha256(
			"abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"
		)) ===
		"248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1",
		"Sparks.Algorithm: Failed validation - SHA-256 multi-block test"
	);

	// HMAC(SHA-1) with 64-byte key
	var key = "000102030405060708090a0b0c0d0e0f" + 
		"101112131415161718191a1b1c1d1e1f" +
		"202122232425262728292a2b2c2d2e2f" + 
		"303132333435363738393a3b3c3d3e3f";
	key = Sparks.split_string(key, 8);
	assert("4f4ca3d5d68ba7cc0a1208c9c61e9c5da0403c0a" ===
		Sparks.Algorithm.hexdigest(Sparks.Algorithm.hmac(key, "Sample #1")),
		"Sparks.Algorithm: Failed validation - SHA-1 with 64-byte key"
	);

	// HMAC(SHA-1) with 20-byte key
	var key = "303132333435363738393a3b3c3d3e3f40414243";
	key = Sparks.split_string(key.replace(/ /g, ""), 8);
	assert("0922d3405faa3d194f82a45830737d5cc6c75d24" ===
		Sparks.Algorithm.hexdigest(Sparks.Algorithm.hmac(key, "Sample #2")),
		"Sparks.Algorithm: Failed validation - SHA-1 with 20-byte key"
	);

	// HMAC(SHA-1) with 100-byte key
	var key = "505152535455565758595a5b5c5d5e5f" +
		"606162636465666768696a6b6c6d6e6f" +
		"707172737475767778797a7b7c7d7e7f" + 
		"808182838485868788898a8b8c8d8e8f" + 
		"909192939495969798999a9b9c9d9e9f" + 
		"a0a1a2a3a4a5a6a7a8a9aaabacadaeaf" + 
		"b0b1b2b3";
	key = Sparks.split_string(key, 8);
	assert("bcf41eab8bb2d802f3d05caf7cb092ecf8d1a3aa" ===
		Sparks.Algorithm.hexdigest(Sparks.Algorithm.hmac(key, "Sample #3")),
		"Sparks.Algorithm: Failed validation - SHA-1 with 100-byte key"
	);

	// HMAC(SHA-1) with 49-byte key
	var key = "707172737475767778797a7b7c7d7e7f8081828384858687" +
		"88898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0000000"
	key = Sparks.split_string(key, 8);
	assert("9ea886efe268dbecce420c7524df32e0751a2a26" ===
		Sparks.Algorithm.hexdigest(Sparks.Algorithm.hmac(key, "Sample #4")),
		"Sparks.Algorithm: Failed validation - SHA-1 with 49-byte key"
	); 
});

Sparks.Algorithm = {

	inside:function inside(mid, min, max, equal) {
		var temp = Math.min(min, max);
		max = Math.max(min, max);
		min = temp;
		if(min < mid && mid < max)
			return true;
		if(equal && (mid === min || mid === max))
			return true;
		return false;	
	},

	factorial:function factorial(num, operation, initial) {
		operation = operation || "mul";
		if(typeof operation === "string")
			operation = operation.slice(0,3).toLowerCase();
		if(typeof initial === "undefined")
			initial = operation === "mul" ? 1 : 0;
		operation = Sparks.operator[operation];
		return Sparks.reduce(initial, Sparks.range(1, num + 1), operation);
	},

	hexdigest:function hexdigest(digest) {
		return Sparks.convert_string(digest, "hex").join("");
	},

	// Rotate left (circular left shift) <rotating_value> by <positions> positions.
	rotate_left:function rotate_left(rotating_value, positions) {
		// x = rotating_value, w = integer length, n = positions
		// ROTL n(x) = (x << n) | (x >> w - n)
		return (rotating_value << positions) | (rotating_value >>> (32 - positions));
	},

	// Rotate right (circular right shift) <rotating_value> by <positions> positions.
	rotate_right:function rotate_right(rotating_value, positions) {
		// x = rotating_value, w = integer length, n = positions
		// ROTR n(x) = (x >> n) | (x << w - n)
		return (rotating_value >>> positions) | (rotating_value << (32 - positions));
	},

	force_64_bit:function force_64_bit(num) {
		return {
			lo:num & 0xffffffff,
			/* The convenient num << 32 won't work here since Javascript converts numbers
				into 32-bit integers when using bitwise operators. */
			hi:Math.floor(num / Math.pow(2, 32))
		}
	},

	force_8_bit:function force_8_bit(thirty_two) {
		return [
			(thirty_two & 0xff000000) >>> 24,
			(thirty_two & 0xff0000) >>> 16,
			(thirty_two & 0xff00) >>> 8,
			thirty_two & 0xff
		];
	},

	get_512_chunks:function get_512_chunks(msg, little_endian) {
		// First, we append a 1-bit to msg. No idea why, but that's the standard.
		msg += String.fromCharCode(0x80);
		var chunklets = Sparks.Algorithm.get_32_from_chars(msg, little_endian);
		/* chunklets.length needs to be a multiple of 16, so we create a spacer.
			We want to add a 64-bit integer representing msgs length, so we pop
			two off once our spacer is constructed. */
		var spacer = Sparks.repeat(0, (16 - ((chunklets.length + 2) % 16)) % 16);
		chunklets = chunklets.concat(spacer);
		var msg_length = Sparks.Algorithm.force_64_bit((msg.length - 1) * 8);
		if(little_endian) {
			chunklets.push(msg_length.lo, msg_length.hi);
		} else {
			chunklets.push(msg_length.hi, msg_length.lo);
		}
		// Create chunks, an array of chunks, which are themselves arrays of 16 32-bit ints.
		var chunks = [];
		while(chunklets.length > 16) {
			chunks.push(chunklets.splice(0, 16));
		}
		chunks.push(chunklets);
		// We want the length, as a 64-bit number, in the last two ints, so fill it up here.
		return chunks;
	},

	get_chars_from_32:function get_chars_from_32(thirty_two) {
		return Sparks.map(Sparks.Algorithm.force_8_bit(thirty_two), String.fromCharCode).join("");
	},

	get_32_from_chars:function get_32_from_chars(msg, little_endian) {
		var nums = [];
		for(var i = 0; i < msg.length; i += 4) {
			if(!little_endian) {
				var num = (msg.charCodeAt(i) << 24) | 
					(msg.charCodeAt(i + 1) << 16) |
					(msg.charCodeAt(i + 2) << 8) |
					(msg.charCodeAt(i + 3));
			} else {
				var num = msg.charCodeAt(i) |
					(msg.charCodeAt(i + 1) << 8) |
					(msg.charCodeAt(i + 2) << 16) |
					(msg.charCodeAt(i + 3) << 24)
			}
			nums.push(num);
		}
		return nums;
	},	

	// HMAC
	// blocksize should be, in bytes, the length of a chunk of your hasher. (sha is 64)
	// hasher should be an iterable hashing function. (sha256, sha1, md5, etc)
	hmac:function(key, msg, hasher, blocksize) {
		key = Sparks.convert_string(key, "hex");
		if(!hasher) {
			// Default to sha1
			hasher = Sparks.Algorithm.sha1;
		}
		if(!blocksize) {
			if(hasher === Sparks.Algorithm.sha1)
				var blocksize = 64;
		}
		// We operate on 32-bits at a time, so divide by 4.
		blocksize /= 4;
		if(key.length > blocksize) {
			for(var i in key) {
				key[i] = Sparks.Algorithm.get_chars_from_32(parseInt(key[i], 16));
			}
			key = Sparks.convert_string(hasher(key.join("")), "hex");
		}
		var inner = "";
		var outer = "";
		for(var i = 0; i < blocksize; i++) {
			// inner: K xor 0x36363636 || msg
			inner += Sparks.Algorithm.get_chars_from_32(parseInt(key[i] || 0, 16) ^ 0x36363636);
			// outer: K xor 0x5c5c5c5c || inner
			outer += Sparks.Algorithm.get_chars_from_32(parseInt(key[i] || 0, 16) ^ 0x5c5c5c5c);
		}
		inner = hasher(inner + msg);
		for(var i in inner) {
			inner[i] = Sparks.Algorithm.get_chars_from_32(inner[i]);
		}
		return hasher(outer + inner.join(""));
	},

	// SHA-256 Cryptographic Hash Algorithm
	sha256:function sha256(msg) {
		/* Some constants used in the algorithm. They're not random, but their 
			origins are irrelevant. */
		var constants = [
			0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
			0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
			0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
			0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
			0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
			0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
			0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
			0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
			0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
			0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
			0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
		];
		/* We need 512-bit chunks from our msg, and the way we get them is very
			specific, so call get_512_chunks to do the hard work for us. */
		var chunks = Sparks.Algorithm.get_512_chunks(msg);
		var hash_values = [
			0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
			0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
		];
		for(var i = 0; i < chunks.length; i++) {
			var chunk = chunks[i];
			// Copy our hash values into our working values.
			var a = hash_values[0];
			var b = hash_values[1];
			var c = hash_values[2];
			var d = hash_values[3];
			var e = hash_values[4];
			var f = hash_values[5];
			var g = hash_values[6];
			var h = hash_values[7];
			for(var j = 0; j < 64; j++) {
				if(j < 16) {
					// For 0-15, we use the values created from get_512_chunks.
					var chunklet = chunk[j];
				} else {
					/* For 16-63, we start using ones that are derived from the
						above, or from ones that derived from derived ones, etc. */
					// sigma0 = ROTR7x XOR ROTR18x XOR SHR3x
					var temp = chunk[j - 15];
					var sigma_0 = Sparks.Algorithm.rotate_right(temp, 7) ^
						Sparks.Algorithm.rotate_right(temp, 18) ^
						temp >>> 3;
					// sigma1 = ROTR17x XOR ROTR19x XOR SHR10x
					var temp = chunk[j - 2];
					var sigma_1 = Sparks.Algorithm.rotate_right(temp, 17) ^	
						Sparks.Algorithm.rotate_right(temp, 19) ^
						temp >>> 10;
					// chunklet = W(t - 7) + W(t - 16) + Sigma0(W(t - 15)) + Sigma1(W(t - 2))
					var chunklet = chunk[j] = 
						(chunk[j - 7] + chunk[j - 16] + sigma_0 + sigma_1) & 0xffffffff;
				}
				/* These calculations are just 4 separate functions, which are then
					summed. Nothing more.  */
				// sigma_0 = ROTR2a XOR ROTR13a XOR ROTR22a
				var sigma_0 = Sparks.Algorithm.rotate_right(a, 2) ^
					Sparks.Algorithm.rotate_right(a, 13) ^
					Sparks.Algorithm.rotate_right(a, 22);
				// maj = (a AND b) XOR (a AND c) XOR (b AND c)
				var maj = (a & b) ^ (a & c) ^ (b & c);
				var second_calculated_value = sigma_0 + maj;
				// sigma_1 = ROTR6e XOR ROTR11e XOR ROTR25e
				var sigma_1 = Sparks.Algorithm.rotate_right(e, 6) ^
					Sparks.Algorithm.rotate_right(e, 11) ^
					Sparks.Algorithm.rotate_right(e, 25);
				// ch = (e AND f) XOR ((NOT e) AND g)
				var ch = (e & f) ^ (~e & g);
				var first_calculated_value = (h + sigma_1 + ch + constants[j] + chunklet) & 0xffffffff;
				// Now that our temporary values are calculated, set our variables to them.
				h = g;
				g = f;
				f = e;
				e = d + first_calculated_value;
				d = c;
				c = b;
				b = a;
				a = (first_calculated_value + second_calculated_value) & 0xffffffff;
			}
			// Sum our values, removing any hi-order trash that cropped up.
			hash_values[0] += a;
			hash_values[1] += b;
			hash_values[2] += c;
			hash_values[3] += d;
			hash_values[4] += e;
			hash_values[5] += f;
			hash_values[6] += g;
			hash_values[7] += h;
			hash_values = Sparks.map(hash_values, function lobitter(value) {
				return value & 0xffffffff;
			});
		}		
		return hash_values;
	},

	// SHA-1 Cryptographic Hash Algorithm
	sha1:function sha1(msg) {
		/* Some constants used in the algorithm. They're not random, but their 
			origins are irrelevant. */
		var constants = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
		/* We need 512-bit chunks from our msg, and the way we get them is very
			specific, so call get_512_chunks to do the hard work for us. */
		var chunks = Sparks.Algorithm.get_512_chunks(msg);
		// Initial hash values.
		var hash_values = [0x67452301,
			0xefcdab89,
			0x98badcfe,
			0x10325476,
			0xc3d2e1f0
		];
		for(var i = 0; i < chunks.length; i++) {
			var chunk = chunks[i];
			// Copy our hash values into our working values.
			var a = hash_values[0];
			var b = hash_values[1];
			var c = hash_values[2];
			var d = hash_values[3];
			var e = hash_values[4];
			for(var j = 0; j < 80; j++) {
				// Our chunklet is an int pulled from our chunk. For 0-15, we use the values
				if(j < 16) {
					// For 0-15, we use the value from get_512_chunks.
					var chunklet = chunk[j];
				} else {
					/* For 16-79, we start using ones that are derived from the
						above, or from ones that derived from derived ones, etc.
						Notice that these offsets are presumably arbitrary. Also notice
						that we could potentially not have these derived values, but instead
						calculate them each time. However, space is not an issue here. */
					var chunklet = chunk[j] = Sparks.Algorithm.rotate_left(
						chunk[j - 3] ^ chunk[j - 8] ^ chunk[j - 14] ^ chunk[j - 16],
						1
					);
				}
				var quarter = Math.floor(j / 20);
				/* We have different functions and constants depending on what quarter 
					of the 80-values we're in, so calculate that here. */
				switch(quarter) {
					case 0: // First quarter - "ch" - (B AND C) OR ((NOT B) AND D)
						// Notice we used an equivalent, optimized version.
						var calculated_value = d ^ (b & (c ^ d));
						break;
					case 2: // Third quarter - "maj" - (B AND C) OR (B AND D) OR (C AND D)
						// Notice we used an equivalent, optimized version.
						var calculated_value = (b & c) | (d & (b | c));
						break;
					case 1: // Second quarter - "parity" - B XOR C XOR D
					case 3: // Fourth quarter - "parity" - B XOR C XOR D
						var calculated_value = b ^ c ^ d;
						break;
				}
				calculated_value += Sparks.Algorithm.rotate_left(a, 5);
				calculated_value += e + constants[quarter] + chunklet;
				e = d;
				d = c;
				c = Sparks.Algorithm.rotate_left(b, 30);
				b = a;
				a = calculated_value;
			}
			// Sum our values, removing any hi-order trash that cropped up.
			hash_values[0] += a;
			hash_values[1] += b;
			hash_values[2] += c;
			hash_values[3] += d;
			hash_values[4] += e;
			hash_values = Sparks.map(hash_values, function lobitter(value) {
				return value & 0xffffffff;
			});
		}		
		return hash_values;
	},

	// Calculate the MD5 of an array of little-endian words, and a bit length
	md5:function md5(msg) {
		var chrsz   = 8;  // bits per input character. 8 - ASCII; 16 - Unicode
		var len = msg.length * chrsz;
		
		// Convert a string to an array of little-endian words
		// If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
		var str2binl = function str2binl(str) {
			var bin = Array();
			var mask = (1 << chrsz) - 1;
			for(var i = 0; i < str.length * chrsz; i += chrsz)
				bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
			return bin;
		}
		
		var x = str2binl(msg);
		
		// Append padding.
		x[len >> 5] |= 0x80 << ((len) % 32);
		x[(((len + 64) >>> 9) << 4) + 14] = len;
		
		var a =  1732584193;
		var b = -271733879;
		var c = -1732584194;
		var d =  271733878;
		
		// Add integers, wrapping at 2^32. This uses 16-bit operations internally
		// to work around bugs in some JS interpreters.
		var safe_add = function safe_add(x, y) {
			var lsw = (x & 0xFFFF) + (y & 0xFFFF);
			var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			return (msw << 16) | (lsw & 0xFFFF);
		}
		
		// Bitwise rotate a 32-bit number to the left.
		var bit_rol = function bit_rol(num, cnt) {
			return (num << cnt) | (num >>> (32 - cnt));
		}
		
		// These functions implement the four basic operations the algorithm uses.
		var md5_cmn = function md5_cmn(q, a, b, x, s, t) {
			return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
		}
		var md5_ff = function md5_ff(a, b, c, d, x, s, t) {
			return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
		}
		var md5_gg = function md5_gg(a, b, c, d, x, s, t) {
			return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
		}
		var md5_hh = function md5_hh(a, b, c, d, x, s, t) {
			return md5_cmn(b ^ c ^ d, a, b, x, s, t);
		}
		var md5_ii = function md5_ii(a, b, c, d, x, s, t) {
			return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
		}
		
		for(var i = 0; i < x.length; i += 16) {
			var olda = a;
			var oldb = b;
			var oldc = c;
			var oldd = d;
			
			a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
			d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
			c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
			b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
			a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
			d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
			c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
			b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
			a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
			d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
			c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
			b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
			a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
			d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
			c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
			b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);
			
			a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
			d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
			c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
			b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
			a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
			d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
			c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
			b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
			a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
			d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
			c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
			b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
			a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
			d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
			c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
			b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);
			
			a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
			d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
			c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
			b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
			a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
			d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
			c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
			b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
			a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
			d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
			c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
			b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
			a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
			d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
			c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
			b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);
			
			a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
			d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
			c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
			b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
			a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
			d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
			c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
			b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
			a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
			d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
			c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
			b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
			a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
			d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
			c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
			b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);
			
			a = safe_add(a, olda);
			b = safe_add(b, oldb);
			c = safe_add(c, oldc);
			d = safe_add(d, oldd);
		}
		
		var binl2hex = function binl2hex(binarray) {
			var hex_tab = "0123456789abcdef";
			var str = "";
			for(var i = 0; i < binarray.length * 4; i++) {
				str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
					hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
			}
			return str;
		}
		var values = Sparks.convert_string(
			Sparks.split_string(binl2hex([a, b, c, d]), 8),
			"number"
		);	
		return values;
	}

}
