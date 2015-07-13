module.exports = function (app) {

  /**
   * @desc Swap solution namespace
   * @namespace
   *
   */
  var solutions = {

    /**
     * @desc TODOOOO
     * @public
     * @arg     decipher_body {string}  Decipher function without inline swapper
     * @arg     html5player  {string}  YT html5player.js
     * @arg     decipherer   {Object}  Decipherer f_ task list
     * @return  decipher_body {string}  Completed decipher func str
     */
    scoped_manip: function (decipher_body, html5player, decipherer) {

      var arr_mani_obj_name = /\;(.{1,3})\..{1,3}\(/.exec(decipher_body);

      if (!arr_mani_obj_name || !arr_mani_obj_name.length) {
        return decipherer.retry(
          '!arr_mani_obj_name || !arr_mani_obj_name.length'
        );
      }

      arr_mani_obj_name = arr_mani_obj_name[1];

      if (arr_mani_obj_name.charAt(0) === '$') {
        arr_mani_obj_name = '\\' + arr_mani_obj_name;
      }

      var arr_mani_obj_regex_str = arr_mani_obj_name + '=\\{.+?\\}\\}\\;',
          arr_mani_obj_regex = new RegExp(arr_mani_obj_regex_str, 'gm');

      var arr_mani_swap_obj_str = arr_mani_obj_regex.exec(html5player);

      if (!arr_mani_swap_obj_str || !arr_mani_swap_obj_str.length) {
        return decipherer.retry(
          '!arr_mani_swap_obj_str || !arr_mani_swap_obj_str.length'
        );
      }

      arr_mani_swap_obj_str = arr_mani_swap_obj_str[0];

      decipher_body = 'var ' + arr_mani_swap_obj_str + decipher_body;

      return decipher_body;
    },

    /**
     * @desc TODOOOO
     * @public
     * @arg     decipher_body {string}  Decipher function w/out inline swapper
     * @arg     html5player  {string}  YT html5player.js
     * @arg     decipherer   {Object}  Decipherer f_ task list
     * @return  decipher_body {string}  Completed decipher func str
     */
    namespaced_var_manip: function (decipher_body, html5player, decipherer) {

      var swap_obj_match = /;.+?=(.{1,3})\..{1,3}\(.+?,.+?\)/g
        .exec(decipher_body);

      if (!swap_obj_match || !swap_obj_match.length) {
        return decipherer.retryAll(
          '!swap_obj_match || !swap_obj_match.length'
        );
      }

      var swap_obj_name = swap_obj_match[1];

      if (swap_obj_name.charAt(0) === '$') {
        swap_obj_name = '\\' + swap_obj_name;
      }

      var swap_obj = getObjFromCode(swap_obj_name, html5player);

      if(!swap_obj) {
        return decipherer.retryAll('!swap_obj');
      }

      var swap_obj_body = /\{(.+)\}\;/g.exec(swap_obj);

      var ripped_methods = {};

      var method_matches =
        swap_obj.match(/.{1,3}\:function\(.{1,3}\)\{.+?\}/g);

      if (!method_matches || !method_matches.length) {
        return decipherer.retryAll(
          '!method_matches || !method_matches.length'
        );
      }

      var method_name,
          method_args,
          method_body,
          method_regex;

      for (var method_i = 0; method_i < method_matches.length; method_i++) {
        var method_match = method_matches[method_i];
        method_match = method_match.replace(/[\,\{]/, '');

        method_regex = /(^.+?):function\((.+?)\)\{(.+?)\}/g
          .exec(method_match);

        if (!method_regex || !method_regex.length) {
          return decipherer.retryAll("!method_regex");
        }

        method_name = method_regex[1];
        method_args = method_regex[2];
        method_body = method_regex[3];

        var find_param_str = swap_obj_name + '\\.' + method_name + '\\(' +
          '(.+?)' + '\\)';

        var replaceRegexStr = swap_obj_name + '\\.' + method_name +
          '\\(.+?\\)';

        var ripped_method = {};

        ripped_method = {
          str: 'function ' + '(' + method_args +'){' + method_body + '}',
          find_calls_regex: new RegExp(find_param_str, 'gmi'),
          method_calls: [],
          replacement_strings: [],
          call_regexs: []
        };

        ripped_method.method_calls = 
          decipher_body.match(ripped_method.find_calls_regex);

        var str = ripped_method.str,
            method_calls = ripped_method.method_calls,
            replacement_strings = ripped_method.replacement_strings,
            call_regexs = ripped_method.call_regexs;

        var method_call,
            parameter,
            replacement_str;
        for (var calls_i = 0; calls_i < method_calls.length; calls_i++) {
          method_call = method_calls[calls_i];
          parameter = /.+?\((.+?)\)/.exec(method_call)[1];

          replacement_str = str + '(' + parameter + ')'
          replacement_strings.push(replacement_str);

          var call_regex_ok_str = method_call.replace(/\./g, '\\.')
            .replace(/\(/g, '\\(').replace(/\)/g, '\\)')
            .replace(/\$/g, '\\$').replace(/\,/g, '\\,');

          call_regexs.push(new RegExp(call_regex_ok_str, 'gm'));
        }

        var call_regex,
            callRegex_i;

        for(callRegex_i = 0; callRegex_i < call_regexs.length; callRegex_i++) {
          call_regex = call_regexs[callRegex_i];
          replacement_str = replacement_strings[callRegex_i];

          decipher_body = decipher_body.replace(call_regex, replacement_str)
        }

        ripped_methods[method_name] = ripped_method;

      } // /for method_i

      return decipher_body;

    },

    /**
     * @desc TODOOOO
     * @public
     * @arg     decipher_body {string}  Decipher function without inline swapper
     * @arg     html5player  {string}  YT html5player.js
     * @arg     decipherer   {Object}  Decipherer f_ task list
     */
    var_manip: function (decipher_body, html5player, decipherer) {
      var swap_fn_name = /;.=(.{1,3})\(.,\d+?\);/g.exec(decipher_body),
          self = this;

      if (!swap_fn_name || !swap_fn_name.length) {
        return decipherer.retryAll('!swap_fn_name || !swap_fn_name.length');
      }

      var swap_fn = swap_fn_name[1];

      if (swap_fn.charAt(0) === '$') {
        swap_fn = '\\' + swap_fn;
      }

      var swapper_match_str = new RegExp("function " + swap_fn
        + "\(.+?,.+?\)\{(.+?)\}", "");
      var swapper_match = swapper_match_str.exec(html5player);


      var swapper_args = swapper_match[1].replace(/[\(\)]/g, '').split(','),
          swapper_body = swapper_match[2];

      var swap_func_str = 'function ';
      for (var i=0, args='('; i<swapper_args.length; i++) {
        args += swapper_args[i] + ',';
      }
      args = args.slice(0, -1) + ')';
      swap_func_str = swap_func_str + args + '{' + swapper_body + '}';

      var parameters = decipher_body.match(/\(.{1,3},.{1,3}\)/g);

      var parameter,
          param_clean,
          i;
      for (i = 0; i < parameters.length; i++) {
        parameter = parameters[i];
        param_clean = parameter.replace(/[\(\)]/g, '');

        var replacement_str = swap_func_str + parameter + ';';

        var swap_switch_regex = 
          new RegExp( swap_fn + "\\\(" + param_clean + "\\\);", 'gim' );

        decipher_body = decipher_body.replace(swap_switch_regex, replacement_str);
      }

      return decipher_body;
    }

  };


  return solutions;

}