const eps = 1e-6;

function gcd(a, b) {
  return b != 0 ? a % b : a;
}

export default class Fraction {
  constructor(a, b) {
    this.up = a, this.dn = b;
  }
  static from_frac(a, b) {
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
  is_neg() {
    return self.up < 0;
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
  toKatex() {
    if (this.up === 0) { // Avoid -0
      this.up = 0;
    }
    if (this.dn === 1) {
      return `{${this.up}}`;
    } else if (this.is_neg()) {
      return `{-\\frac{${-this.up}}{${this.dn}}}`;
    } else {
      return `{\\frac{${this.up}}{${this.dn}}}`;
    }
  }
}
