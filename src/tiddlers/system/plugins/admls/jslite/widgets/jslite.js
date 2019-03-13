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
  this.computeAttributes();
  this.execute();
  this.$js = this.getAttribute("$js","");
  var text = this.$js.replace(/\r/mg,"");
  const splitScript = this.split(text);
  console.log(splitScript);
  const uniqueWords = this.getUniqueWords(splitScript);

  try {
    eval(text);  
  }
  catch(e) {
    text = "Javascript Error";
  }
  var textNode = this.document.createTextNode(text);
  parent.insertBefore(textNode,nextSibling);
  this.domNodes.push(textNode);
};

/* Computes the internal state of this widget. */
JSWidget.prototype.execute = function() {
  // Parse variables
  var self = this;
  self.args = {};
  $tw.utils.each(this.attributes,function(val,key) {
  	if(key.charAt(0) !== "$") {
    	self.args[key] = val;
  		//self.setVariable(key,val);
  	}
  });

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
    }else{
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
  return split;
};

JSWidget.prototype.getUniqueWords = function(array) {
  let words = {};
  for(let i=0; i<array.length; i++) {
    if(/^[A-z_$]+[\w$]*/.test(array[i])) {
      if(!words[array[i]]) {
        words[array[i]] = [i];
      }else{
        words[array[i]].push(i);
      }
    }
  }
  // console.log(Object.keys(words));
  console.log(words);
  return words;
};

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

/* Finally exports the widget constructor. */
exports.jslite = JSWidget;

})();