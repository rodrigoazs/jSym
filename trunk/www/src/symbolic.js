function symbolicAdder( nodel, noder )
{
  if( nodel.type == NODE_CONST && noder.type == NODE_CONST && nodel.value == 0 && noder.value == 0 )
    return createNode ( NODE_CONST, 0 );
  else if ( nodel.type == NODE_CONST && nodel.value == 0 )
    return noder;
  else if ( noder.type == NODE_CONST && noder.value == 0 )
    return nodel;
  else if ( nodel.type == NODE_CONST && noder.type == NODE_CONST )
    return createNode( NODE_CONST, Number( nodel.value ) + Number( noder.value ) );
  else
    return createNode( NODE_OP, OP_ADD, nodel, noder );
}

function symbolicMultiplier( nodel, noder )
{
  if( nodel.type == NODE_CONST &&  nodel.value == 0 || noder.type == NODE_CONST  && noder.value == 0 )
    return createNode ( NODE_CONST, 0 );
  else if ( nodel.type == NODE_CONST && nodel.value == 1 )
    return noder;
  else if ( noder.type == NODE_CONST && noder.value == 1 )
    return nodel;
  else if ( nodel.type == NODE_CONST && noder.type == NODE_CONST )
    return createNode( NODE_CONST, Number( nodel.value ) * Number( noder.value ) );
  else
    return createNode( NODE_OP, OP_MUL, nodel, noder );
}

function symbolicSubtractor( nodel, noder )
{
  // case both are consts 0
  if( nodel.type == NODE_CONST && noder.type == NODE_CONST && nodel.value == 0 && noder.value == 0 )
    return createNode ( NODE_CONST, 0 );
  // case left is const 0
  else if ( nodel.type == NODE_CONST && nodel.value == 0 )
    return symbolicNegation( noder );
  // case both are consts 0 and left is smaller than right
  else if ( nodel.type == NODE_CONST && noder.type == NODE_CONST  && Number( nodel.value ) < Number( noder.value ))
  	return symbolicNegation(createNode( NODE_CONST, -(Number( nodel.value ) - Number( noder.value ))));
  // case both are consts 0 and rifht is smaller than left or equal
  else if ( nodel.type == NODE_CONST && noder.type == NODE_CONST )
    return createNode( NODE_CONST, Number( nodel.value ) - Number( noder.value ) );
  // case both sides are negations
  else if ( nodel.type == NODE_OP && nodel.value == OP_NEG && noder.type == NODE_OP && noder.value == OP_NEG )
  	return symbolicSubtractor( noder.children[0], nodel.children[0]);
  // case right side is a negation
  else if ( noder.type == NODE_OP && noder.value == OP_NEG )
  	return symbolicAdder( nodel.children[0], noder);
  // case left sides is a negation and both sides are consts
  else if ( nodel.type == NODE_OP && nodel.value == OP_NEG && nodel.children[0].type == NODE_CONST && noder.type == NODE_CONST )
  	return symbolicNegation( createNode(NODE_CONST, Number( nodel.children[0].value ) + Number( noder.value )) );
  else
    return createNode( NODE_OP, OP_SUB, nodel, noder );
}

function symbolicNegation( node )
{
  if( node.type == NODE_CONST && node.value == 0)
    return createNode ( NODE_CONST, 0 );
  else if ( node.type == NODE_CONST )
    return createNode( NODE_CONST, Number( node.value ) * -1 );
  else
    return createNode( NODE_OP, OP_NEG, node );
}

function symbolicDivisor( nodel, noder )
{
  // Division by zero
  //if( noder.type == NODE_CONST  && noder.value == 0 )
  //  return createNode ( NODE_CONST, 0 );
  if ( nodel.type == NODE_CONST && nodel.value == 0 )
    return createNode(NODE_CONST, 0 );
  else if ( noder.type == NODE_CONST && noder.value == 1 )
    return nodel;
  else if ( nodel.type == NODE_CONST && noder.type == NODE_CONST && Number( nodel.value ) % Number( noder.value ) == 0 )
    return createNode( NODE_CONST, Number( nodel.value ) / Number( noder.value ) );
  else
    return createNode( NODE_OP, OP_DIV, nodel, noder );
}

function symbolicPower( node, nodep )
{
  if( nodep.type == NODE_CONST &&  nodep.value == 0 )
    return createNode ( NODE_CONST, 1 );
  else if ( nodep.type == NODE_CONST && nodep.value == 1 )
    return node;
  else if ( node.type == NODE_CONST && node.value == 1 )
    return createNode ( NODE_CONST, 1 );
  else if ( node.type == NODE_CONST && node.value == 0 )
    return createNode ( NODE_CONST, 0 );
  else if ( node.type == NODE_CONST && node.type == NODE_CONST && nodep.type == NODE_CONST && nodep.type == NODE_CONST )
    return createNode( NODE_CONST, Math.pow( Number( node.value ),  Number( nodep.value ) ) );
  else
    return createNode( NODE_OP, OP_POW, node, nodep );
}

function stringEquationParen( node )
{
  if(node.type == NODE_OP)
    return "(" + stringEquation( node ) + ")";
  else
    return stringEquation( node );
}


function symbolicDiff( node )
{
  var ret = 0;
  
  if( !node )
    return 0;
    
  switch( node.type )
  {
    case NODE_OP:
      switch( node.value )
      {
        case OP_ADD:
          ret = symbolicAdder( symbolicDiff( node.children[0] ), symbolicDiff( node.children[1] ) );
          break;
        case OP_SUB:
          ret = symbolicSubtractor( symbolicDiff( node.children[0] ), symbolicDiff( node.children[1] ) );
          break;
        case OP_DIV:
          ret = symbolicDivisor(symbolicSubtractor(symbolicMultiplier(symbolicDiff(node.children[0]), node.children[1]), symbolicMultiplier(symbolicDiff(node.children[1]), node.children[0])), symbolicPower(node.children[1], createNode(NODE_CONST, 2)));
          break;
        case OP_MUL:
          ret = symbolicAdder( symbolicMultiplier( symbolicDiff(node.children[0]), node.children[1] ), symbolicMultiplier( symbolicDiff(node.children[1]), node.children[0] ) );
          break;
        case OP_NEG:
          ret = symbolicNegation(symbolicDiff(node.children[0]));
          break;
        case OP_POW:
          ret = symbolicAdder(symbolicMultiplier(symbolicMultiplier(node.children[1], symbolicPower(node.children[0], symbolicSubtractor(node.children[1], createNode(NODE_CONST, 1)))), symbolicDiff(node.children[0])), symbolicMultiplier(symbolicMultiplier(symbolicPower(node.children[0], node.children[1]), createNode(NODE_FUNC, FUNC_NLOG, node.children[0])), symbolicDiff(node.children[1])));
          break;
      }
      break;

    case NODE_FUNC:
      switch( node.value )
      {
        case FUNC_SIN:
          ret = symbolicMultiplier( symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_COS, node.children[0]) );
          break;
        case FUNC_COS:
          ret = symbolicNegation(symbolicMultiplier( symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_SIN, node.children[0]) ));
          break; 
        case FUNC_ASINH:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_SQRT, symbolicAdder(createNode(NODE_CONST, 1), symbolicPower(node.children[0], createNode(NODE_CONST, 2)))));
          break;
        case FUNC_SINH:
          ret = symbolicMultiplier(symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_COSH, node.children[0]));
          break;
        case FUNC_ASIN:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_SQRT, symbolicSubtractor(createNode(NODE_CONST, 1), symbolicPower(node.children[0], createNode(NODE_CONST, 2)))));
          break;
        case FUNC_ACOSH:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_SQRT, symbolicSubtractor(symbolicPower(node.children[0], createNode(NODE_CONST, 2)), createNode(NODE_CONST, 1))));
          break;
        case FUNC_COSH:
          ret = symbolicMultiplier(symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_SINH, node.children[0]));
          break;
        case FUNC_ACOS:
          ret = symbolicDivisor(symbolicNegation(symbolicDiff(node.children[0])), createNode(NODE_FUNC, FUNC_SQRT, symbolicSubtractor(1, symbolicPower(node.children[0], createNode(NODE_CONST, 2)))));
          break;
        case FUNC_ATANH:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), symbolicSubtractor(createNode(NODE_CONST, 1), symbolicPower(node.children[0], createNode(NODE_CONST, 2))));
          break;
        case FUNC_TANH:
          ret = symbolicMultiplier(symbolicDiff(node.children[0]), symbolicPower(createNode(NODE_FUNC, FUNC_SECH, node.children[0]), createNode(NODE_CONST, 2)));
          break;
        case FUNC_ATAN:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), symbolicAdder(createNode(NODE_CONST, 1), symbolicPower(node.children[0], createNode(NODE_CONST, 2))));
          break;
        case FUNC_TAN:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), symbolicPower(createNode(NODE_FUNC, FUNC_SEC, node.children[0]), createNode(NODE_CONST, 2)));
          break;
        case FUNC_ASECH:
          ret = symbolicDivisor(symbolicNegation(symbolicDiff(node.children[0])), symbolicMultiplier(symbolicMultiplier(node.children[0], creteNode(NODE_FUNC, FUNC_SQRT, symbolicDivisor(symbolicSubtractor(1, node.children[0]), symbolicAdder(1, node.children[0])))), symbolicAdder(1, node.children[0])));
          break;
        case FUNC_SECH:
          ret = symbolicMultiplier(symbolicNegation(symbolicDiff(node.children[0])), symbolicMultiplier(createNode(NODE_FUNC, FUNC_SECH, node.children[0]), createNode(NODE_FUNC, FUNC_TANH, node.children[0])));
          break;
        case FUNC_ASEC:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), symbolicMultiplier(node.children[0], createNode(NODE_FUNC, FUNC_SQRT, symbolicSubtractor(symbolicPower(node.children[0], createNode(NODE_CONST, 2)), createNode(NODE_CONST, 1)))));
          break;
        case FUNC_SEC:
          ret = symbolicMultiplier(symbolicDiff(node.children[0]), symbolicMultiplier(createNode(NODE_FUNC, FUNC_TAN, node.children[0]), createNode(NODE_FUNC, FUNC_SEC, node.children[0])));
          break;
        case FUNC_ACSCH:
          ret = symbolicDivisor(symbolicNegation(symbolicDiff(node.children[0])), symbolicMultiplier(createNode(NODE_FUNC, FUNC_SQRT, symbolicAdder(createNode(NODE_CONST, 1), symbolicDivisor(createNode(NODE_CONST, 1), symbolicPower(node.children[0], createNode(NODE_CONST, 2))))), symbolicPower(node.children[0], createNode(NODE_CONST, 2))));
          break;
        case FUNC_CSCH:
          ret = symbolicMultiplier(symbolicMultiplier(symbolicNegation(symbolicDiff(node.children[0])), createNode(NODE_FUNC, FUNC_COTH, node.children[0])), createNode(NODE_FUNC, FUNC_CSCH, node.children[0]));
          break;
		case FUNC_ACSC:
          ret = symbolicDivisor(symbolicNegation(symbolicDiff(node.children[0])), symbolicMultiplier(node.children[0], createNode(NODE_FUNC, FUNC_SQRT, symbolicSubtractor(symbolicPower(node.children[0], createNode(NODE_CONST, 2)), createNode(NODE_CONST, 1)))));
          break;
        case FUNC_CSC:
          ret = symbolicMultiplier(symbolicMultiplier(symbolicNegation(symbolicDiff(node.children[0])), createNode(NODE_FUNC, FUNC_COT, node.children[0])), createNode(NODE_FUNC, FUNC_CSC, node.children[0]));
          break;
        case FUNC_ACOTH:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), symbolicSubtractor(createNode(NODE_CONST, 1), symbolicPower(node.children[0], createNode(NODE_CONST, 2))));
          break;
        case FUNC_COTH:
          ret = symbolicMultiplier(symbolicNegation(symbolicDiff(node.children[0])), symbolicPower(createNode(NODE_FUNC, FUNC_CSCH, node.children[0]), createNode(NODE_CONST, 2)));
          break;
        case FUNC_ACOT:
          ret = symbolicDivisor(symbolicNegation(symbolicDiff(node.children[0])), symbolicAdder(createNode(NODE_CONST, 1), symbolicPower(node.children[0], createNode(NODE_CONST, 2))));
          break;
        case FUNC_COT:
          ret = symbolicMultiplier(symbolicNegation(symbolicDiff(node.children[0])), symbolicPower(createNode(NODE_FUNC, FUNC_CSC, node.children[0]), createNode(NODE_CONST, 2)));
          break;
        case FUNC_SQRT:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), symbolicMultiplier(createNode(NODE_CONST, 2), createNode(NODE_FUNC, FUNC_SQRT, node.children[0])));
          break;
        case FUNC_EXP:
          ret = symbolicMultiplier(symbolicDiff(node.children[0]), createNode(NODE_FUNC, FUNC_EXP, node.children[0]));
          break;
        case FUNC_NLOG:
          ret = symbolicDivisor(symbolicDiff(node.children[0]), node.children[0]);
          break;
        case FUNC_BLOG:
          ret = symbolicDivisor(symbolicDiff(node.children[1]), symbolicMultiplier(node.children[1], createNode(NODE_FUNC, FUNC_NLOG, node.children[0])));
          break;
      }
      break;

    case NODE_VAR:
      if( node.value == "x" )
        ret = createNode( NODE_CONST, 1 );
      else
        ret = createNode( NODE_CONST, 0 );
      break;
      
    case NODE_CONST:
      ret = createNode( NODE_CONST, 0 );
      break;
  }
  
  return ret;  
}

function stringEquation( node )
{
  var ret = 0;
  var left = 0;
  var right = 0;
  
  if( !node )
    return 0;
    
  switch( node.type )
  {
    case NODE_OP:
      switch( node.value )
      {
        case OP_ADD:
          ret = stringEquation( node.children[0] ) + "+" + stringEquation( node.children[1] );
          break;
        case OP_SUB:
          ret = stringEquation( node.children[0] ) + "-" + stringEquation( node.children[1] );
          break;
        case OP_DIV:
          ret = stringEquationParen( node.children[0] ) + "/" + stringEquationParen( node.children[1] );
          break;
        case OP_MUL:
          left = node.children[0].type == NODE_OP && (node.children[0].value == OP_ADD || node.children[0].value == OP_SUB) ? "(" + stringEquation( node.children[0] ) + ")" : stringEquation( node.children[0] );
          right = node.children[1].type == NODE_OP && (node.children[1].value == OP_ADD || node.children[1].value == OP_SUB) ? "(" + stringEquation( node.children[1] ) + ")" : stringEquation( node.children[1] );
          ret = left + "*" + right;
          break;
        case OP_NEG:
          ret = node.children[0].type == NODE_OP ? "(-" + stringEquation( node.children[0] ) + ")" : "-"+ stringEquationParen( node.children[0] );
          break;
        case OP_POW:
          left = node.children[0].type == NODE_OP ? "(" + stringEquation( node.children[0] ) + ")" : stringEquation( node.children[0] );
          right = node.children[1].type == NODE_OP ? "(" + stringEquation( node.children[1] ) + ")" : stringEquation( node.children[1] );
          ret = left +"^"+ right;
          break;
      }
      break;

    case NODE_FUNC:
      switch( node.value )
      {
        case FUNC_SIN:
          ret = "sin(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_COS:
          ret = "cos(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ASINH:
          ret = "asinh(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_SINH:
          ret = "sinh(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ASIN:
          ret = "asin(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ACOSH:
          ret = "acosh(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_COSH:
          ret = "cosh(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ACOS:
          ret = "acos(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ATANH:
          ret = "atanh(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_TANH:
          ret = "tanh(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ATAN:
          ret = "atan(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_TAN:
          ret = "tan(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ASECH:
          ret = "asech(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_SECH:
          ret = "sech(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ASEC:
          ret = "asec(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_SEC:
          ret = "sec(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ACSCH:
          ret = "acsch(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_CSCH:
          ret = "csch(" + stringEquation( node.children[0] ) + ")";
          break;
		case FUNC_ACSC:
          ret = "acsc(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_CSC:
          ret = "csc(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ACOTH:
          ret = "acoth(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_COTH:
          ret = "coth(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_ACOT:
          ret = "acot(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_COT:
          ret = "cot(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_SQRT:
          ret = "sqrt(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_EXP:
          ret = "exp(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_NLOG:
          ret = "log(" + stringEquation( node.children[0] ) + ")";
          break;
        case FUNC_BLOG:
          ret = "log" + stringEquation( node.children[0] ) + "(" + stringEquation( node.children[1] ) + ")";
          break;
      }
      break;

    case NODE_VAR:
      ret = node.value;
      break;
      
    case NODE_CONST:
      ret = node.value;
      break;
  }
  
  return ret;  
}

function toTex( node )
{
  var ret = 0;
  var left = 0;
  var right = 0;
  
  if( !node )
    return 0;
    
  switch( node.type )
  {
    case NODE_OP:
      switch( node.value )
      {
        case OP_ADD:
          ret = toTex( node.children[0] ) + "+" + toTex( node.children[1] );
          break;
        case OP_SUB:
          ret = toTex( node.children[0] ) + "-" + toTex( node.children[1] );
          break;
        case OP_DIV:
          ret = "{" + toTex( node.children[0] ) + "}/{" + toTex( node.children[1] ) +"}";
          break;
        case OP_MUL:
          if(node.children[1].type == NODE_CONST)
          {
          	left = node.children[0].type == NODE_OP && (node.children[0].value == OP_ADD || node.children[0].value == OP_SUB) ? "(" + toTex( node.children[0] ) + ")" : toTex( node.children[0] );
            ret = left + "·" + toTex( node.children[1] );
          }else if(node.children[1].type == NODE_VAR){
            left = node.children[0].type == NODE_OP && (node.children[0].value == OP_ADD || node.children[0].value == OP_SUB) ? "(" + toTex( node.children[0] ) + ")" : toTex( node.children[0] );
            ret = left + "\\," + toTex( node.children[1] );
          }else{
            left = node.children[0].type == NODE_OP && (node.children[0].value == OP_ADD || node.children[0].value == OP_SUB) ? "(" + toTex( node.children[0] ) + ")" : toTex( node.children[0] );
            right = node.children[1].type == NODE_OP && (node.children[1].value == OP_ADD || node.children[1].value == OP_SUB) ? "(" + toTex( node.children[1] ) + ")" : toTex( node.children[1] );
            ret = left + "\\," + right;
          }
          break;
        case OP_NEG:
          //ret = node.children[0].type == NODE_OP ? "(-" + toTex( node.children[0] ) + ")" : "-"+ toTex( node.children[0] );
          ret = "(-" + toTex( node.children[0] ) + ")";
          break;
        case OP_POW:
          left = node.children[0].type == NODE_OP ? "(" + toTex( node.children[0] ) + ")" : toTex( node.children[0] );
          ret = left +"^{"+ toTex(node.children[1]) +"}";
          break;
      }
      break;

    case NODE_FUNC:
      switch( node.value )
      {
        case FUNC_SIN:
          ret = "sin(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_COS:
          ret = "cos(" + toTex( node.children[0] ) + ")";
          break;
         case FUNC_ASINH:
          ret = "asinh(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_SINH:
          ret = "sinh(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ASIN:
          ret = "asin(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ACOSH:
          ret = "acosh(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_COSH:
          ret = "cosh(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ACOS:
          ret = "acos(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ATANH:
          ret = "atanh(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_TANH:
          ret = "tanh(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ATAN:
          ret = "atan(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_TAN:
          ret = "tan(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ASECH:
          ret = "asech(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_SECH:
          ret = "sech(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ASEC:
          ret = "asec(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_SEC:
          ret = "sec(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ACSCH:
          ret = "acsch(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_CSCH:
          ret = "csch(" + toTex( node.children[0] ) + ")";
          break;
		case FUNC_ACSC:
          ret = "acsc(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_CSC:
          ret = "csc(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ACOTH:
          ret = "acoth(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_COTH:
          ret = "coth(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_ACOT:
          ret = "acot(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_COT:
          ret = "cot(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_SQRT:
          ret = "√{" + toTex( node.children[0] ) + "}";
          break;
        case FUNC_EXP:
          ret = "exp(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_NLOG:
          ret = "log(" + toTex( node.children[0] ) + ")";
          break;
        case FUNC_BLOG:
          ret = "log_{" + toTex( node.children[0] ) + "}(" + toTex( node.children[1] ) + ")";
          break;
      }
      break;

    case NODE_VAR:
      ret = node.value;
      break;
      
    case NODE_CONST:
      ret = node.value;
      break;
  }
  
  return ret;  
}

function initparser( node )
{
  var func = stringEquation( node );
  var diff = symbolicDiff( node );
  //var teste = automatic_simplify(node);
  var a1 = construct(OP_POW, construct(OP_ADD, createNode(NODE_CONST, 1), createNode(NODE_VAR, "x")), createNode(NODE_CONST, 3));
  var a2 = construct(OP_ADD, createNode(NODE_CONST, 1), createNode(NODE_VAR, "x"));
  var a3 = createNode(NODE_CONST, 2);
  var array = new Array(a1, a2, a3);
  array.sort(compare); 
  //alert(compare(a3, a2));
  //alert(toMathML( diff ) );
  $("#console").html("<p>$$d/{dx}("+toTex(node)+") = "+toTex( diff )+"$$</p><br><br>"+toTex( diff )+"<br>"+stringEquation(diff));
  M.parseMath(document.getElementById("console"));
}