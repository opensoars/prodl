/** fixSwappper solutions
 * They are run in try/catch
 * ! KEEP IT SYNC !
 * All solution functions use the below structure
 * @arg     decipherBody {string}  inclomplete decipher func str
 * @arg     html5player  {string}  YT html5player.js file
 * @arg     self         {Class}   Decipherer.js
 * @return  decipherBody {string}  complete decipher func str
 */

var solutions = {};

solutions.arrManipObjName = function (decipherBody, html5player, self){
  /**
   * Let's do it a little bit more simple this time, we're going to include
   * the array manipulation swap object in the functionBody string
   */
  var arrManipObjName = /\;(.{1,3})\..{1,3}\(/.exec(decipherBody);

  if(!arrManipObjName || !arrManipObjName.length)
    return self.retry('!arrManipObjName || !arrManipObjName.length');

  arrManipObjName = arrManipObjName[1];

  if(arrManipObjName.charAt(0) === '$')
    arrManipObjName = '\\' + arrManipObjName;

  var arrManipObjRegExpStr = arrManipObjName + '=\\{.+?\\}\\}\\;',
      arrManipObjRegExp = new RegExp(arrManipObjRegExpStr, 'gm');

  var arrManipSwapObjStr = arrManipObjRegExp.exec(html5player);

  if(!arrManipSwapObjStr || !arrManipSwapObjStr.length)
    return self.retry('!arrManipSwapObjStr || !arrManipSwapObjStr.length');

  arrManipSwapObjStr = arrManipSwapObjStr[0];

  decipherBody = 'var ' + arrManipSwapObjStr + decipherBody;

  return decipherBody;
};

solutions.varDecSwapObj = function (decipherBody, html5player, self){
  var swapObjMatch = /;.+?=(.{1,3})\..{1,3}\(.+?,.+?\)/g.exec(decipherBody);

  if(!swapObjMatch || !swapObjMatch.length)
    return self.retry('!swapObjMatch || !swapObjMatch.length');

  var swapObjName = swapObjMatch[1];

  if(swapObjName.charAt(0) === '$') swapObjName = '\\' + swapObjName;

  var swapObj = getObjFromCode(swapObjName, html5player);

  if(!swapObj) return self.retry('!swapObj');

  var swapObjBody = /\{(.+)\}\;/g.exec(swapObj);

  var rippedMethods = {};

  var methodMatches = swapObj.match(/.{1,3}\:function\(.{1,3}\)\{.+?\}/g);

  if(!methodMatches || !methodMatches.length)
    return self.retry('!methodMatches || !methodMatches.length');

  var methodName, methodArgs, methodBody,
      methodRegExp;

  for(var method_i=0; method_i<methodMatches.length; method_i+=1){
    var methodMatch = methodMatches[method_i];
    methodMatch = methodMatch.replace(/[\,\{]/, '');

    var methodRegExp = /(^.+?):function\((.+?)\)\{(.+?)\}/g
      .exec(methodMatch);


    if(!methodRegExp || !methodRegExp.length) 
      return self.retry("!methodRegExp");

    methodName = methodRegExp[1];
    methodArgs = methodRegExp[2];
    methodBody = methodRegExp[3];

    var findParameterStr = swapObjName + '\\.' + methodName + '\\('
      + '(.+?)' + '\\)';

    var replaceRegexStr = swapObjName + '\\.' + methodName + '\\(.+?\\)';

    var rippedMethod = {};

    rippedMethod = {
      str: 'function ' + '(' + methodArgs +'){' + methodBody + '}',
      findCallsRegex: new RegExp(findParameterStr, 'gmi'),
      methodCalls: [],
      callParameters: [],
      replacementStrings: [],
      callRegexs: []
    };

    rippedMethod.methodCalls = 
      decipherBody.match(rippedMethod.findCallsRegex);

    var str = rippedMethod.str,
        methodCalls = rippedMethod.methodCalls,
        callParameters = rippedMethod.callParameters,
        replacementStrings = rippedMethod.replacementStrings,
        callRegexs = rippedMethod.callRegexs;

    var methodCall, parameter;
    for(var calls_i=0; calls_i<methodCalls.length; calls_i+=1){
      methodCall = methodCalls[calls_i];
      parameter = /.+?\((.+?)\)/.exec(methodCall)[1];

      replacementStr = str + '(' + parameter + ')'
      replacementStrings.push(replacementStr);

      var callRegexOkayStr = methodCall.replace(/\./g, '\\.')
        .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
        .replace(/\$/g, '\\$').replace(/\,/g, '\\,');

      callRegexs.push(new RegExp(callRegexOkayStr, 'gm'));
    }

    var callRegex, replacementStr;

    for(var callRegex_i=0; callRegex_i<callRegexs.length; callRegex_i+=1){
      callRegex = callRegexs[callRegex_i];
      replacementStr = replacementStrings[callRegex_i];

      decipherBody = decipherBody.replace(callRegex, replacementStr)
    }

    rippedMethods[methodName] = rippedMethod;

  } // /for method_i

  return decipherBody;
};

solutions.swapOutOfBody = function (decipherBody, html5player, self){
  var swapFnMatch = /;.=(.{1,3})\(.,\d+?\);/g.exec(decipherBody);

  if(!swapFnMatch || !swapFnMatch.length)
    return self.retry('!swapFnMatch || !swapFnMatch.length');

  var swapFn = swapFnMatch[1];

  if(swapFn.charAt(0) === '$') swapFn = '\\' + swapFn;

  var swapperMatchStr = new RegExp("function " + swapFn
    + "\(.+?,.+?\)\{(.+?)\}", "");
  var swapperMatch = swapperMatchStr.exec(html5player);


  var swapperArgs = swapperMatch[1].replace(/[\(\)]/g, '').split(','),
      swapperBody = swapperMatch[2];

  var swapFuncSTR = 'function ';
  for(var i=0, args='('; i<swapperArgs.length; i+=1)
    args += swapperArgs[i] + ',';
  args = args.slice(0, -1) + ')';
  swapFuncSTR = swapFuncSTR + args + '{' + swapperBody + '}';

  var parameters = decipherBody.match(/\(.{1,3},.{1,3}\)/g);

  var parameter, parameterClean
  for(var i=0; i<parameters.length; i+=1){
    parameter = parameters[i];
    parameterClean = parameter.replace(/[\(\)]/g, '');

    var replacementStr = swapFuncSTR + parameter + ';';

    var swapSwitchRegExp = 
      new RegExp( swapFn + "\\\(" + parameterClean + "\\\);", 'gim' );

    decipherBody = decipherBody.replace(swapSwitchRegExp, replacementStr);

  }

  return decipherBody;
};


module.exports = solutions;