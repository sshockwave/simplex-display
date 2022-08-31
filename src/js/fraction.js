const eps = 1e-6;

function gcd(a, b) {
  return b != 0 ? gcd(b, a % b) : a;
}

export default class Fraction {
  constructor(a, b) {
    this.up = a, this.dn = b;
  }
  static zero = new Fraction(0, 1);
  static from_frac(a, b) {
    if (b === 0) {
      throw 'Denominator cannot be zero';
    }
    if (b < 0) {
      a = -a, b = -b;
    }
    const d = Math.abs(gcd(a, b));
    if (d != 1) {
      a /= d, b /= d;
    }
    return new Fraction(a, b);
  }
  static from_num(n) {
    if (Number.isInteger(n)) {
      return new Fraction(n, 1);
    } else {
      let is_neg = false;
      if (n < 0) {
        n = -n;
        is_neg = true;
      }
      let up = 0, dn = 1;
      let first = true;
      while (n > eps) {
        const cur = Math.floor(n);
        up = up * 10 + cur;
        if (first) {
          first = false;
        } else {
          dn *= 10;
        }
        n = (n - cur) * 10;
      }
      return this.from_frac(up, dn);
    }
  }
  static from_str(str) {
    let match = str.match(/^(-?\d+)\/(\d+)$/);
    if (match) {
      return this.from_frac(Number.parseInt(match[1]), Number.parseInt(match[2]));
    }
    match = str.match(/^(-?\d+)$/);
    if (match) {
      return new this(Number.parseInt(match[1]), 1);
    }
    match = str.match(/^(-?\d+\.\d+)$/);
    if (match) {
      return this.from_num(Number.parseFloat(match[1]));
    }
    throw "Unrecognized number";
  }
  eq(that) {
    return this.up === that.up && this.dn === that.dn;
  }
  is_pos() {
    return this.up > 0;
  }
  is_neg() {
    return this.up < 0;
  }
  is_zero() {
    return this.up === 0;
  }
  neg() {
    return this.constructor.from_frac(-this.up, this.dn);
  }
  add(that) {
    const d = gcd(this.dn, that.dn);
    return this.constructor.from_frac(this.up * (that.dn / d) + that.up * (this.dn / d), this.dn / d * that.dn);
  }
  sub(that) {
    return this.add(that.neg());
  }
  mul(that) {
    const d1 = Math.abs(gcd(this.up, that.dn));
    const d2 = Math.abs(gcd(that.up, this.dn));
    return new this.constructor((this.up / d1) * (that.up / d2), (this.dn / d2) * (that.dn / d1));
  }
  div(that) {
    const d1 = gcd(this.up, that.up);
    const d2 = gcd(this.dn, that.dn);
    let a = (this.up / d1) * (that.dn / d2);
    let b = (that.up / d1) * (this.dn / d2);
    if (b < 0) {
      a = -a, b = -b;
    }
    return new this.constructor(a, b);
  }
  to_katex() {
    if (this.dn === 1) {
      return this.up.toString();
    }
    return `{${this.up < 0 ? '-' : ''}\\frac{${Math.abs(this.up)}}{${this.dn}}}`;
  }
  to_coef_katex(is_first) {
    let sign = '+';
    if (this.is_neg()) {
      sign = '-';
    }
    if (sign === '+' && is_first) {
      sign = '';
    }
    let a = Math.abs(this.up);
    if (this.dn === 1) {
      if (a === 1) {
        return sign;
      }
      return `{${sign}${a}}`;
    }
    return `{${sign}\\frac{${a}}{${this.dn}}}`;
  }
}
