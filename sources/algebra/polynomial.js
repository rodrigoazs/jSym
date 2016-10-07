// Solve Polynomial (node)
// Given any kind of polynomial, returns
// the roots found
function solve_polynomial(node)
{
  // verify if it is a simple polynomial with one element
  if(kind(node) == OP_POW && is_symbol(node.children[0], "x"))
  {
    return [createInteger(0)];
  }
  var hash = {};
  var roots = [];
  var coefficients = coefficients_of_polynomial(node);
  // maximum of x^100 in polynomial_degree
  while(coefficients != null && coefficients.length > 0)
  {
    var root = get_polynomial_root(coefficients);
    if(root == null) return roots;
    if(Array.isArray(root))
    {
      for(var i=0; i<root.length; i++)
      {
        var s = stringEquation(root[i]);
        if(!(s in hash))
        {
          hash[s] = 1;
          roots = roots.concat(root[i]);
        }
      }
    }
    else
    {
      var s = stringEquation(root);
      if(!(s in hash))
      {
        hash[s] = 1;
        roots = roots.concat(root);
      }
    }
    if(coefficients.length == 2) return roots;
    coefficients = briot_ruffini(coefficients, root);
  }
  return roots.sort(compare);
}

// Form polynomial from coefficients (cf)
// Given an array of coefficients, create back a polynomial
// as ASAE
function form_polynomial_from_coefficients(coefficients)
{
  var operands = [];
  for(var i=0; i<coefficients.length; i++)
  {
    operands.push(construct(OP_MUL, coefficients[i], construct(OP_POW, createSymbol("x"), createInteger(i))));
  }
  return automatic_simplify(construct(OP_ADD, operands));
}

// Get Polynomial Root (cf)
// Given the array of coefficients,
// uses bhaskara if its is quadratic or
// look for a possible root, evaluate and return it
function get_polynomial_root(coefficients)
{
  if(coefficients.length == 3)
  {
    if(kind(coefficients[0]) == NODE_INT && coefficients[0].value == 0)
    {
      return createInteger(0);
    }
    if(kind(coefficients[1]) == NODE_INT && coefficients[1].value == 0)
    {
      return [construct_neg(automatic_simplify(construct(OP_POW, construct_div(construct_neg(coefficients[0]), coefficients[2]), construct(OP_DIV, createInteger(1), createInteger(2))))), automatic_simplify(construct(OP_POW, construct_div(construct_neg(coefficients[0]), coefficients[2]), construct(OP_DIV, createInteger(1), createInteger(2))))];
    }
    var roots = bhaskara(coefficients[2], coefficients[1], coefficients[0]);
    return roots;
  }
  else
  {
    var possible_roots = possible_roots_of_polynomial(coefficients);
    if(possible_roots != null)
    {
      for(var i=0; i<possible_roots.length; i++)
      {
        var node = form_polynomial_from_coefficients(coefficients);
        var a = automatic_simplify(substitute(node, createSymbol("x"), possible_roots[i])); //automatic_simplify(algebraic_expand
        //console.log('substitute' + stringEquation(node) + ' por '+ stringEquation(possible_roots[i]) + ' resulta em '+ stringEquation(a));
        if(compare(a, createInteger(0)) == 0)
        {
          return possible_roots[i];
        }
      }
    }
  }
  return null;
}

// Possible roots of polynomial (cf)
// Given the array of coefficients of a polynomial, find its
// possible roots by guessing divisors of coefficient
// of x^0 and x^N
function possible_roots_of_polynomial(cf)
{
  if(cf != null)
  {
    var first = cf[cf.length-1];
    var last = cf[0];
    if(kind(last) == NODE_INT && kind(first) == NODE_INT)
    {
      var d = [];
      var hash = {};
      var divisors = divisors_of(Math.abs(last.value));
      for(var i=0; i<divisors.length; i++)
      {
        var a1 = createInteger(-divisors[i]);
        var a2 = createInteger(divisors[i]);
        hash[stringEquation(a1)] = 1;
        hash[stringEquation(a2)] = 1;
        d.push(a1);
        d.push(a2);
        var a3 = automatic_simplify(construct(OP_DIV, createInteger(-divisors[i]), createInteger(first.value)));
        var a4 = automatic_simplify(construct(OP_DIV, createInteger(divisors[i]), createInteger(first.value)));
        var s3 = stringEquation(a3);
        var s4 = stringEquation(a4);
        if(!(s3 in hash))
        {
          d.push(a3);
          hash[s3] = 1;
        }
        if(!(s4 in hash))
        {
          d.push(a4);
          hash[s4] = 1;
        }
      }
    }
    // else{
    //   var d = [];
    //   var hash = {};
    //   var last_m = (kind(last) != OP_MUL) ?  construct(OP_MUL, last) : last; //If it is just one term, construct mul of it
    //   var divisors = [];
    //   for(var i=0; i<last_m.children.length; i++)
    //   {
    //     divisors[i] = [createInteger(1)];
    //     var n = operand(last_m, i);
    //     if(kind(n) == NODE_INT)
    //     {
    //       var divisors_int = divisors_of(Math.abs(n.value));
    //       for(var k=0; k<divisors_int.length; k++)
    //       {
    //         divisors[i].push(createInteger(divisors_int[k]));
    //       }
    //     }
    //     else if(kind(n) == OP_POW && kind(n.children[1]) == NODE_INT)
    //     {
    //       var exp = n.children[1].value;
    //       for(var j=exp-1; j>=1; j--)
    //       {
    //         divisors[i].push(automatic_simplify(construct_div(n, construct(OP_POW, n.children[0], createInteger(j)))));
    //       }
    //       divisors[i].push(n);
    //     }
    //     else
    //     {
    //       divisors[i].push(n);
    //     }
    //   }
    //   var cases = allPossibleCases(divisors);
    //   for(var i=0; i<cases.length; i++)
    //   {
    //     var a1 = automatic_simplify(construct_neg(cases[i]));
    //     var a2 = automatic_simplify(cases[i]);
    //     var s1 = stringEquation(a1);
    //     var s2 = stringEquation(a2);
    //     if(!(s1 in hash))
    //     {
    //       d.push(a1);
    //       hash[s1] = 1;
    //     }
    //     if(!(s2 in hash))
    //     {
    //       d.push(a2);
    //       hash[s2] = 1;
    //     }
    //     var a3 = automatic_simplify(construct_div(a1, first));
    //     var a4 = automatic_simplify(construct_div(a2, first));
    //     var s3 = stringEquation(a3);
    //     var s4 = stringEquation(a4);
    //     if(!(s3 in hash))
    //     {
    //       d.push(a3);
    //       hash[s3] = 1;
    //     }
    //     if(!(s4 in hash))
    //     {
    //       d.push(a4);
    //       hash[s4] = 1;
    //     }
    //   }
    // }
    return d;
  }
  return null;

}

// All Possible cases
// return divisors of symbols (used in possible roots)
function allPossibleCases(arr) {
  if (arr.length == 1) {
    return arr[0];
  } else {
    var result = [];
    var allCasesOfRest = allPossibleCases(arr.slice(1));  // recur with the rest of array
    for (var i = 0; i < allCasesOfRest.length; i++) {
      for (var j = 0; j < arr[0].length; j++) {
        result.push(automatic_simplify(construct(OP_MUL, arr[0][j], allCasesOfRest[i])));
      }
    }
    return result;
  }

}

// Coefficients of Polynomial (n)
// If it is a valid polynomial returns its array of coefficients
// as ASAE
function coefficients_of_polynomial(node)
{
  var degree = identify_polynomial_degree(node);
  // maximum of polynomial x^100
  if(degree > 100) return null;
  if(degree != null)
  {
    var coefficients = [];
    for(var i=0; i<=degree; i++){ coefficients[i] = [createInteger(0)]; }
    if(kind(node) == OP_ADD)
    {
      for(var i=0; i<node.children.length; i++)
      {
        if(free_of_symbol(node.children[i], "x"))
        {
          coefficients[0].push(node.children[i]);
        }
        else
        {
          coefficients[1].push(term_of(node.children[i], createNode(NODE_SYM, "x")));
          for(var j=2; j<=degree; j++)
          {
            coefficients[j].push(term_of(node.children[i], construct(OP_POW, createNode(NODE_SYM, "x"), createNode(NODE_INT, j))));
          }
        }
      }
    }
    else
    {
      if(free_of_symbol(node, "x"))
      {
        coefficients[0].push(node);
      }
      else
      {
        coefficients[1].push(term_of(node, createNode(NODE_SYM, "x")));
        for(var j=2; j<=degree; j++)
        {
          coefficients[j].push(term_of(node, construct(OP_POW, createNode(NODE_SYM, "x"), createNode(NODE_INT, j))));
        }
      }
    }
    for(var i=0; i<=degree; i++){ coefficients[i] = automatic_simplify(construct(OP_ADD, coefficients[i])); }
    return coefficients;
  }
  return null;
}

// Identify Polynomial Degree (n)
// If it is a valid polynomial returns its degree
// otherwise returns null
function identify_polynomial_degree(node)
{
  var degree = 0;
  if(kind(node) == OP_ADD)
  {
    for(var i=0; i<node.children.length; i++)
    {
      var n = operand(node, i);
      var d = identify_polynomial_mul(n);
      if(d == null) return null;
      if(d > degree)
      {
        degree = d;
      }
    }
    return degree;
  }
  else if(kind(node) == OP_MUL)
  {
    var d = identify_polynomial_mul(node);
    if(d == null) return null;
    if(d > degree)
    {
      degree = d;
    }
    return degree;
  }
  else
  {
    var d = identify_polynomial_power(node);
    if(d == null) return null;
    if(d > degree)
    {
      degree = d;
    }
    return degree;
  }
  return null;
}

// Identify Polynomial Mul (n)
// If it is free of symbol x returns its degree 0,
// if it is product call polynomial power for each one
// otherwise returns null
function identify_polynomial_mul(n)
{
  if(free_of_symbol(n, "x"))
  {
    return 0; // 0 degree
  }
  else if(kind(n) == OP_MUL)
  {
    var d;
    for(var i=0; i<n.children.length; i++)
    {
      d = identify_polynomial_power(n.children[i]);
      if(d != null)
      {
        return d;
      }
    }
  }else{
    var d = identify_polynomial_power(n);
    if(d != null)
    {
      return d;
    }
  }
  return null;
}

// Identify Polynomial Power (n)
// If it is a symbol x returns its degree 1,
// if it is a power of integer returns its exponent
// otherwise returns null
function identify_polynomial_power(n)
{
  if(kind(n) == OP_POW && is_symbol(n.children[0], "x"))
  {
      if(kind(n.children[1]) == NODE_INT && n.children[1].value >= 0)
      {
        return n.children[1].value;
      }else{
        return null;
      }
  }
  else if(is_symbol(n, "x"))
  {
    return 1;
  }else
  {
    return null;
  }
}

// ------------ DEPRECATED FUNCTION ----------------------------
// Univariate Quadratic (u)
// Given an expression ASAE in form o univariate
// quadratic function, returns its roots.
// returns [] if its not quadratic
function univariate_quadratic(node)
{
  if(kind(node) == OP_ADD)
  {
    var a = [];
    var b = [];
    var c = [];
    for(var i=0; i<node.children.length; i++)
    {
      var a_term = term_of(node.children[i], construct(OP_POW, createNode(NODE_SYM, "x"), createNode(NODE_INT, 2)));
      var b_term = term_of(node.children[i], createNode(NODE_SYM, "x"));
      if(!free_of_symbol(a_term, "x") || !free_of_symbol(b_term, "x"))
      {
        return [];
      }
      a.push(a_term);
      b.push(b_term);
      if(kind(a_term) == NODE_INT && a_term.value == 0 && kind(b_term) == NODE_INT && b_term.value == 0)
      {
        c.push(node.children[i]);
      }
    }
    a = construct(OP_ADD, a);
    b = construct(OP_ADD, b);
    c = construct(OP_ADD, c);
  }
  else
  {
    var a = term_of(node, construct(OP_POW, createNode(NODE_SYM, "x"), createNode(NODE_INT, 2)));
    var b = term_of(node, createNode(NODE_SYM, "x"));
    var c = createNode(NODE_INT, 0);
    if(kind(a) == NODE_INT && a.value == 0 && kind(b) == NODE_INT && b.value == 0)
    {
      return [];
    }
  }
  return bhaskara(a, b, c);
}

// Bhaskara (a, b, c)
// Given the terms a, b and c
// returns its roots
function bhaskara(a, b, c)
{
  var l = construct(OP_MUL, createNode(NODE_INT, -1), b);
  var delta = construct(OP_ADD, construct(OP_POW, b, createNode(NODE_INT, 2)), construct(OP_MUL, createNode(NODE_INT, -1), construct(OP_MUL, [createNode(NODE_INT, 4), a, c])));
  var r = construct(OP_POW, delta, construct(OP_DIV, createNode(NODE_INT, 1), createNode(NODE_INT, 2)));
  var d = construct(OP_MUL, createNode(NODE_INT, 2), a);
  var x1 = construct(OP_MUL, construct(OP_ADD, l, r), construct(OP_POW, d, createNode(NODE_INT, -1)));
  var x2 = construct(OP_MUL, construct(OP_ADD, l, construct(OP_MUL, r, createNode(NODE_INT, -1))), construct(OP_POW, d, createNode(NODE_INT, -1)));
  return [automatic_simplify(x1), automatic_simplify(x2)];
}

// Briot-Ruffini (c, r)
// c: array of coefficients (integer nodes)
// r: root found (integer node)
function briot_ruffini(c, r)
{
  var new_c = c.slice();
  var temp = [];
  var new_pol = [];

  new_c.reverse();
  new_pol.push(new_c[0]);
  temp = temp.concat([null, createInteger(new_c[0].value*r.value)]);
  for(var i=1; i<new_c.length; i++)
  {
    var n = createInteger(new_c[i].value + temp[i].value);
    new_pol.push(n);
    temp.push(createInteger(n.value*r.value));
  }

  if(new_pol[new_pol.length-1].value != 0) return null;
  var ret_pol = [];
  for(var i=new_pol.length-2; i>=0; i--) { ret_pol.push(new_pol[i]); }
  return ret_pol;
}

// Numeric Solve polynomial quadratic (coef)
// c: array of coefficients (type float or integer)
// return: array of complex roots [a, b, c, d] -> a+bi, c+di
function numeric_solvep2(coef) {
  var delta;
  var s = new Array(4);

  delta = coef[1] * coef[1] - 4 * coef[2] * coef[0];
  s[0] = -coef[1] / 2 / coef[2];
  s[2] = s[0];

  if(delta < 0)
  {
     s[1] = Math.sqrt(-delta) / 2 / coef[2];
     s[3] = -s[1];
  }
  else
  {
     s[1] = 0;
     s[3] = 0;

     s[0] = s[0] + Math.sqrt(delta) / 2 / coef[2];
     s[2] = s[2] - Math.sqrt(delta) / 2 / coef[2];
  }

  return s;
}

// Bairstow's method (coef)
// c: array of coefficients (type float or integer)
// return: array of pairs of floats that represents its roots
// [0, 1, 2, 3] - > 0+1i, 2+3i
 function bairstow(coef) {
  var a = coef.slice();
  var i;
  var N = a.length;
  var h, k;
  var result = new Array();

  var r = Math.random();
  var s = Math.random();

  var b = new Array(N);
  var c = new Array(N);

  a.reverse();

  while (N > 3) {

   b[N - 1] = 1;
   b[N - 2] = 1;

   while ((Math.abs(b[N - 1]) + Math.abs(b[N - 2])) > 1e-6) {

    b[0] = a[0];
    b[1] = a[1] + r * b[0];

    for(i = 2; i < N; i++) b[i] = a[i] + r * b[i - 1] + s * b[i - 2];

    c[0] = b[0];
    c[1] = b[1] + r * c[0];

    for(i = 2; i < N - 1; i++) c[i] = b[i] + r * c[i - 1] + s * c[i - 2];

    h = (-b[N - 2] * c[N - 3] + b[N - 1] * c[N - 4]) / (c[N - 3] * c[N - 3] - c[N - 2] * c[N - 4]);
    k = (-b[N - 1] * c[N - 3] + b[N - 2] * c[N - 2]) / (c[N - 3] * c[N - 3] - c[N - 2] * c[N - 4]);

    r = r + h;
    s = s + k;
   }

   result = result.concat(numeric_solvep2([-s, -r, 1]));

   a = b.slice(0, N - 2);
   N = a.length;
  }

  if (N == 3) {
   result = result.concat(numeric_solvep2(a.reverse()));
  }
  else {
   result = result.concat([-a[1] / a[0], 0]);
  }

  return result;
 }
