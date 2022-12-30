const eps = 1e-6;

function gcd(a, b) {
  return b != 0 ? gcd(b, a % b) : a;
}

export default class Fraction {
  constructor(a, b) {
    this.up = a, this.dn = b;
    this.higher = null;
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
      for (let first = true; (n * dn - up) > eps * dn;) {
        if (first) {
          first = false;
        } else {
          up *= 10, dn *= 10;
        }
        up += Math.floor(n * dn - up);
      }
      if (is_neg) {
        up = -up;
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
    if (!(this.higher === null && that.higher === null)) {
      return false;
    }
    if (this.higher === null && that.higher === null) {
      return true;
    }
    if (this.higher === null || that.higher === null) {
      return false;
    }
    return this.higher.eq(that.higher);
  }
  is_pos() {
    if (this.higher !== null) {
      return this.higher.is_pos();
    }
    return this.up > 0;
  }
  is_neg() {
    if (this.higher !== null) {
      return this.higher.is_neg();
    }
    return this.up < 0;
  }
  is_zero() {
    return this.higher === null && this.up === 0;
  }
  neg() {
    let t = this.constructor.from_frac(-this.up, this.dn);
    if (this.higher !== null) {
      t.higher = this.higher.neg();
    }
    return t;
  }
  add(that) {
    const d = gcd(this.dn, that.dn);
    let lower = this.constructor.from_frac(this.up * (that.dn / d) + that.up * (this.dn / d), this.dn / d * that.dn);
    let higher = this.constructor.from_frac(0, 1);
    if (this.higher !== null) {
      higher = higher.add(this.higher);
    }
    if (that.higher !== null) {
      higher = higher.add(that.higher);
    }
    if (!higher.is_zero()) {
      lower.higher = higher;
    }
    return lower;
  }
  sub(that) {
    return this.add(that.neg());
  }
  mul(that) {
    const d1 = Math.abs(gcd(this.up, that.dn));
    const d2 = Math.abs(gcd(that.up, this.dn));
    let lower = new this.constructor((this.up / d1) * (that.up / d2), (this.dn / d2) * (that.dn / d1));
    let higher = this.constructor.from_frac(0, 1);
    if (this.higher !== null) {
      higher = higher.add(this.higher.mul(that));
    }
    if (that.higher !== null) {
      higher = higher.add(that.higher.mul(new this.constructor(this.up, this.dn)));
    }
    if (!higher.is_zero()) {
      lower.higher = higher;
    }
    return lower;
  }
  div(that) {
    const d1 = gcd(this.up, that.up);
    const d2 = gcd(this.dn, that.dn);
    let a = (this.up / d1) * (that.dn / d2);
    let b = (that.up / d1) * (this.dn / d2);
    if (b < 0) {
      a = -a, b = -b;
    }
    if (that.higher !== null) {
      throw "Donominator cannot have higher order";
    }
    let lower = new this.constructor(a, b);
    if (this.higher !== null) {
      lower.higher = this.higher.div(that);
    }
    return lower;
  }
  to_katex(is_first = true) {
    let ans = '';
    if (this.higher !== null) {
      ans += this.higher.to_coef_katex(is_first) + 'M';
      is_first = false;
    }
    const sign = this.up < 0 ? '-' : is_first ? '' : '+';
    const a = Math.abs(this.up);
    if (this.dn === 1) {
      ans += `${sign}${a}`;
    } else {
      ans += `{${sign}\\frac{${a}}{${this.dn}}}`;
    }
    return ans;
  }
  to_coef_katex(is_first) {
    let sign = this.is_neg() ? '-' : is_first ? '' : '+';
    if (this.up != 0 && this.higher !== null) {
      let lower = new this.constructor(this.up, this.dn);
      return `{${sign}(${this.higher.to_coef_katex(true)}M${lower.to_katex(false)})}`;
    }
    if (this.higher !== null) {
      return `{${this.higher.to_coef_katex(is_first)}M}`;
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
