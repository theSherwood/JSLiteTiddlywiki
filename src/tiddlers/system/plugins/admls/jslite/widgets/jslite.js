/*\
created: 20190312173730699
type: application/javascript
title: $:/plugins/admls/jslite/widgets/jslite.js
tags: 
modified: 20190312195530815
module-type: widget
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var JSWidget = function(parseTreeNode, options) {
  this.initialise(parseTreeNode, options);
};
  
/* "Inherits" from the Widget base "class" in order to get all
 * the basic widget functionality.
 */
JSWidget.prototype = new Widget();

/* Renders this widget into the DOM. */
JSWidget.prototype.render = function(parent,nextSibling) {
  this.parentDomNode = parent;
  this.declareSafeWords();
  this.computeAttributes();
  this.execute();
  this.errors = [];

  this.$js = this.getAttribute("$js","");
  let text = this.$js.replace(/\r/mg,"");
  console.log('TEXT:', text);
  const splitScript = this.split(text);
  console.log('SPLITSCRIPT:', splitScript);
  const words = this.getWords(splitScript);
  console.log('KEYWORDS:', words.keywords);
  const checkResults = this.checkAgainstSafeWords(words.keywords);
  console.log('PASSEDCHECK:', checkResults.passedCheck);
  console.log('FAILEDCHECK:', checkResults.failedCheck);
  const wikiVariables = this.checkAgainstWikiVariables(checkResults.failedCheck);
  console.log('WIKIVARIABLES:', wikiVariables);
  const declarationString = this.constructWikiVariableString(wikiVariables);
  console.log('DECLARATIONSTRING:', declarationString);

  text = declarationString + text;

  try {
    if(this.errors.length > 0){
      throw this.errors;
    } else {
    eval(text);
    } 
  }
  catch(e) {
    text = e;
    console.log(e);
  }
  var textNode = this.document.createTextNode(text);
  parent.insertBefore(textNode,nextSibling);
  this.domNodes.push(textNode);
};

/* Computes the internal state of this widget. */
JSWidget.prototype.execute = function() {
  // Parse variables
  // var self = this;
  // self.args = {};
  // $tw.utils.each(this.attributes,function(val,key) {
  // 	if(key.charAt(0) !== "$") {
  //     self.args[key] = val;
  // 		//self.setVariable(key,val);
  // 	}
  // });
  // console.log('ARGUMENTS', self.args);
/*
  this.js = this.getAttribute("js","");
  this.wrapper = "let namespace = () => {
  	" + this.js + ";
    return;
    };
    namespace();"
    */
  this.makeChildWidgets();
}; 

JSWidget.prototype.split = function(str) {
  let split = [];
  let word = "";
  let number = "";
  let string = "";
  for (let i = 0; i < str.length; i++) {
    if(word.length > 0) {
      switch (true) {
        case /[\w$]/.test(str[i]):
          word += str[i];
          break;
        case /[\d]/.test(str[i]):
          split.push(word);
          word = "";
          number += str[i];
          break;
        case /['"]/.test(str[i]):
          split.push(word);
          word = "";
          string += str[i];
          break;
        default:
          split.push(word);
          word = "";
          split.push(str[i]);
          break;
      }
    }else if(number.length > 0) {
      switch (true) {
        case /[\d]/.test(str[i]):
          number += str[i];
          break;
        case /[\w$]/.test(str[i]):
          split.push(number);
          number = "";
          word += str[i];
          break;
        case /['"]/.test(str[i]):
          split.push(number);
          number = "";
          string += str[i];
          break;
        default:
          split.push(number);
          number = "";
          split.push(str[i]);
          break;
      }
    }else if(string.length > 0) {
      switch (true) {
        case (string[0] === str[i]):
          string += str[i];
          split.push(string)
          string = "";
          break;
        default:
          string += str[i];
          break;
      }
    }else {
      switch (true) {
        case /[\w$]/.test(str[i]):
          word += str[i];
          break;
        case /[\d]/.test(str[i]):
          number += str[i];
          break;
        case /['"]/.test(str[i]):
          string += str[i];
          break;
        default:
          split.push(str[i]);
          break;
      }
    }
  }
  // console.log('W', word, 'N', number, 'S', string);
  split.push(word + number + string);
  return split;
};

JSWidget.prototype.getWords = function(array) {
  let keywords = {};
  let declaredVariables = {};

  let dotOperatorFlag;
  let variableDeclarationFlag;
  for(let i=0; i<array.length; i++) {
    if(/\./.test(array[i])) {
      dotOperatorFlag = true;
    }else if(["let","const","var"].includes(array[i])) {
      // console.log('VARIABLE', array[i]);
      variableDeclarationFlag = true;
      if(!keywords[array[i]]) {
        keywords[array[i]] = [i];
      }else{
        keywords[array[i]].push(i);
      }
    }else if(/[a-zA-Z_$]+[\w$]*/.test(array[i])) { // Includes hyphens for wiki variables: /^[A-z_$]+[\w$-]*/
      if(!dotOperatorFlag && !variableDeclarationFlag) {
        if(declaredVariables[array[i]]) {
          declaredVariables[array[i]].push(i);
        }else if(!keywords[array[i]]) {
          keywords[array[i]] = [i];
        }else{
          keywords[array[i]].push(i);
        }
      }else if(variableDeclarationFlag) {
        if(!keywords[array[i]]) {
          declaredVariables[array[i]] = [i];
        }else{
          this.errors.push(`"${array[i]}" redeclared or used prior to declaration`)
        }
        variableDeclarationFlag = false;
      }else{
        dotOperatorFlag = false;
      }
    }
  }
  // console.log(keywords);
  // console.log(declaredVariables)
  return {
    keywords: keywords,
    declaredVariables: declaredVariables
  }
};

JSWidget.prototype.checkAgainstSafeWords = function(words) {
  const passedCheck = [];
  const failedCheck = [];
  Object.keys(words).forEach(word => {
    if(this.safeWords.includes(word)) {
      passedCheck.push(word);
    } else {
      failedCheck.push(word);
    }
  })
  return {
    passedCheck: passedCheck,
    failedCheck: failedCheck
  }
};

JSWidget.prototype.checkAgainstWikiVariables = function(words) {
  const wikiVariables = {};
  words.forEach(word => {
    const value = this.getVariable(word);
    if(value) {
      wikiVariables[word] = value;
    } else {
      this.errors.push(`"${word}" doesn't appear in whitelist or wiki variables`);
    }
  });
  return wikiVariables;
};

JSWidget.prototype.constructWikiVariableString = function(wikiVariables) {
  let wikiVariableString = "";
  Object.keys(wikiVariables).forEach(key => {
    const variableDeclaration = `let ${key} = ${JSON.stringify(wikiVariables[key])}; `;
    wikiVariableString += variableDeclaration;
  });
  return wikiVariableString;
};

/* May or may not be worth doing.
Change wiki variable format "tv-wiki-link" to tvWikiLink.

JSWidget.prototype.javascriptifyVariableName = function(variableName) {
  const variableArray = variableName.split("");
  for(let i=0; i<variableArray.length; i++) {
    if(variableArray[i] === "-") {
      variableArray[i+1] = variableArray[i+1].toUpperCase();
    }
  }
  return variableArray.join('').replace(/[-]/g, "");
};
*/

/*
JSWidget.prototype.getWords = function(str) {
  // var re = new RegExp('[A-z]+[\w$]*', 'g');
	var re = new RegExp('[A-z]+[\w$]*', 'g');
    let words = {};
    let word;
    while(word = re.exec(str)) {
        if(!words[word[0]]) {
        	words[word[0]] = [word.index];
        }else {
        	words[word[0]].push(word.index);
        }
    }
    // console.log(Object.keys(words));
    // console.log(words);
    return words;
};
*/

JSWidget.prototype.replaceWords = function(str, words, replacements) {
	for(let key of replacements) {
    	if(words[key]) {
        	let wordLength = replacements[key].length;
            //words[key].forEach
        }
    }
};
  
/* Selectively refreshes this widget if needed and returns
 * true if either this widget itself or one of its children
 * needs to be re-rendered.
 */
JSWidget.prototype.refresh = function(changedTiddlers) {
  var changedAttributes = this.computeAttributes(),
      hasChangedAttributes = $tw.utils.count(changedAttributes) > 0;
  if (hasChangedAttributes) {
      /* ... */
  }
  return this.refreshChildren(changedTiddlers) || hasChangedAttributes;
};

JSWidget.prototype.declareSafeWords = function() {
  this.safeWords = [
  'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'null', 'true', 'void', 'with', 'await', 'break', 'catch', 'class', 'const', 'false', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof',

  'undefined', 'NaN', 'Math', 'Number', 'Object', 'Array', 'Set', 'Map', 'Date', 'alert', 'console', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'JSON', 'parseFloat', 'parseInt', 'prototype', 'String', 'setTimeout', 'setInterval', 'isPrototypeOf', 'isNaN', 'toString', 'of', 'Boolean', 'RegExp', 'Infinity', 'isFinite', 'Function', 'Symbol', 'Error', 'BigInt', 'Generator', 'GeneratorFunction', 'Promise', 'async', 'await', 'AsyncFunction'
]
};

/*
const reservedWords = [
  'do', 'if', 'in', 'for', 'let', 'new', 'try', 'var', 'case', 'else', 'enum', 'eval', 'null', 'true', 'this', 'void', 'with', 'await', 'break', 'catch', 'class', 'const', 'false', 'super', 'throw', 'while', 'yield', 'delete', 'export', 'import', 'public', 'return', 'static', 'switch', 'typeof', 'default', 'extends', 'finally', 'package', 'private', 'continue', 'debugger', 'function', 'arguments', 'interface', 'protected', 'implements', 'instanceof',

  'undefined', 'NaN', 'Math', 'Number', 'Object', 'Array', 'Set', 'Map', 'Date', 'alert', 'console', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'JSON', 'parseFloat', 'parseInt', 'prototype', 'String', 'setTimeout', 'setInterval', 'isPrototypeOf', 'isNaN', 'toString', 'of', 'Boolean', 'RegExp', 'Infinity', 'isFinite', 'Function', 'Symbol', 'Error', 'BigInt', 'Generator', 'GeneratorFunction', 'Promise', 'async', 'await', 'AsyncFunction'
]
*/


/* Finally exports the widget constructor. */
exports.jslite = JSWidget;

})();