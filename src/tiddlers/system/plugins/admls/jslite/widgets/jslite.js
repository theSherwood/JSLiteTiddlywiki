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
  eval(text);
  this.getWords(text);
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

JSWidget.prototype.getWords = function(str) {
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
    console.log(Object.keys(words));
    console.log(words);
    return words;
};

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