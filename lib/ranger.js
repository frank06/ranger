var Ranger = function(range) {
  
  var isInteger = function(n) { return typeof n === 'number' && (n % 1) === 0 };
  
  if (!range || range.collapsed) {
    return; 
  }
  
  if (!range.startContainer || !range.endContainer || !isInteger(range.startOffset) || !isInteger(range.endOffset)) {
    throw new Error("Invalid range");
  }
  
  this._range = {};
  
  if (typeof range.startContainer === 'string') {
    this._range.startContainer = Ranger.xpath.getElement(range.startContainer);
  } else {
    this._range.startContainer = range.startContainer;
  }
  
  if (typeof range.endContainer === 'string') {
    this._range.endContainer = Ranger.xpath.getElement(range.endContainer);
  } else {
    this._range.endContainer = range.endContainer;
  }
  
  this._range.startOffset = range.startOffset;
  this._range.endOffset = range.endOffset;
  
  this._range.commonAncestorContainer = range.commonAncestorContainer;
  
  // Determine common ancestor node
  
  var contains = function(n1, n2) {
    return n1.compareDocumentPosition(n2) & Node.DOCUMENT_POSITION_CONTAINED_BY;
  };

  if (!this._range.commonAncestorContainer) {
    var parent = this._range.startContainer.parentNode;
    while (parent && !contains(parent, this._range.endContainer)) {
      parent = parent.parentNode;
    }
    this._range.commonAncestorContainer = parent;
  }
  
  // Calculate text nodes
    
  var isTextNode = function(node) { return node.nodeType === 3 };
  
  var start = this._range.startContainer,
    startOffset = this._range.startOffset,
    end = this._range.endContainer,
    endOffset = this._range.endOffset,
    container = this._range.commonAncestorContainer;
  
  // Determine order, swap if order is inverted
  
  if (start.compareDocumentPosition(end) === Node.DOCUMENT_POSITION_PRECEDING) {
    var temp = start,
      tempOffset = startOffset;
    start = end;
    end = temp;
    startOffset = endOffset;
    endOffset = tempOffset;
  }
      
  // Determine start and end text nodes

  var d1 = Ranger._findDeepestNode(start, startOffset),
    d2 = Ranger._findDeepestNode(end, endOffset);
    
  start = d1[0];
  startOffset = d1[1];
  end = d2[0];
  endOffset = d2[1];
  
  if (!start || !end) throw new Error("Invalid node/offset", this.toJSON());
  
  // Determine if the browser is a piece of shit or not
  
  var probeDiv = document.createElement("div");
  probeDiv.innerHTML = "<!--[if IE 9]><script id='ie9'></script><![endif]-->";
  this.isIE9 = probeDiv.firstChild.id == 'ie9';
  
  // Determine edge nodes and offset
  
  var newRange = {};
  
  if (isTextNode(start)) {
    newRange.start = start.splitText(startOffset);
    this.ie9Workaround(start);
  } else {
    newRange.start = start;
  }
  
  if (start == end) {
    if (isTextNode(newRange.start)) {
      newRange.start.splitText(endOffset - startOffset);
      this.ie9Workaround(newRange.start);
    }
    newRange.end = newRange.start;
  } else {
    if (isTextNode(end)) {
      end.splitText(endOffset);
      this.ie9Workaround(end);
    }
    newRange.end = end;
  }
  
  // Collect text nodes
  
  var occured = { start: false, end: false };
  
  this._textNodes = Ranger.collectTextNodes(container, newRange.start, newRange.end, occured);  
  
};

Ranger.prototype.textNodes = function() {
  return this._textNodes;
}

Ranger.prototype.paint = function(wrapperClass) {
  
  if (!this._textNodes) return;
  
  this._wrapperClass = wrapperClass;
  
  return this._textNodes.map(function(node) {
    
    var parent = node.parentNode;
    
    var wrapper = document.createElement('span');
    wrapper.className = wrapperClass;
    
    parent.replaceChild(wrapper, node);
    wrapper.appendChild(node);
    
    return wrapper;
    
  });
  
};

Ranger.prototype.toString = function(nodes) {
  
  nodes = nodes || this._textNodes;
  
  return nodes.reduce(function(s, current) {
    return s += current.textContent; 
  }, "").trim();
  
};

Ranger.prototype.toJSON = function(context, ignoreClassName) {
  
  if (!this._range) return {};
  
  ignoreClassName = ignoreClassName || this._wrapperClass;
  
  var serialize = function(elem) {
    
    var parent,
      offset = 0;
    
    if (elem.nodeType === 3) {
      parent = elem.parentNode;
      while (parent.className === ignoreClassName) parent = parent.parentNode;
      
      var textNodes = Ranger.collectTextNodes(parent);
      textNodes = textNodes.slice(0, textNodes.indexOf(elem));

      offset = textNodes.reduce(function(acc, child) {
        return acc += child.nodeValue.length;
      }, 0);
      
    } else if (elem.nodeType === 1) {
      parent = elem;
    }
    
    var xpath = Ranger.xpath.getXPath(parent, context);
    
    return [xpath, offset];
    
  }.bind(this);
  
  var start = serialize(this._range.startContainer),
    end = serialize(this._range.endContainer);

  return {
    startContainer: start[0],
    startOffset: start[1] + this._range.startOffset,
    endContainer: end[0],
    endOffset: end[1] + this._range.endOffset
  }
  
};


// Utils

Ranger.collectTextNodes = function(elem, start, end, occured) {
  
  if (elem.nodeType === 3) elem = elem.parentNode;
  
  var children = Array.prototype.slice.call(elem.childNodes),
    occured = occured || { start: true, end: false };

  return children.reduce(function(nodes, child) {
    
    if (occured.end || (child instanceof SVGElement)) return nodes;
    
    if (child == start) occured.start = true;
    if (child == end) occured.end = true;

    // TODO? whitespace = /^[\s\n]*$/; && !whitespace.test(child.nodeValue)
    if (occured.start && child.nodeType === 3) {
      nodes.push(child);
    } else if (child.nodeType === 1) {
      nodes = nodes.concat(Ranger.collectTextNodes(child, start, end, occured));
    }

    return nodes;

  }, []);

};

Ranger._findDeepestNode = function(elem, offset) {
  
  if (elem instanceof SVGElement) return [elem, 0];
  if (elem.nodeType === 3) {
    if (offset > elem.nodeValue.length) offset = elem.nodeValue.length;
    return [elem, offset];
  }
  
  var accumulated = 0, i = 0, node;
    
  var nodes = Ranger.collectTextNodes(elem);
  
  if (nodes.length === 0) return [elem, 0]; // elem doesn't have text nodes
  
  var nodeLength = this.prototype.toString.call(this, nodes).length;
  if (offset > nodeLength) offset = nodeLength;
  
  do {
    node = nodes[i]; i++;
    accumulated += node.nodeValue.length;
  } while (accumulated < offset);
  
  var previousTextNodesLength = accumulated - node.nodeValue.length, // accumulated - current node
    newOffset = offset - previousTextNodesLength;
    
  return [node, newOffset];
  
};

Ranger.prototype.ie9Workaround = function(elem) {
  if (this.isIE9) {
    // workaround to update the text node state in the DOM
    // http://stackoverflow.com/questions/7378186/ie9-childnodes-not-updated-after-splittext
    var p = elem.parentNode;
    var t = p.ownerDocument.createTextNode("");
    p.appendChild(t);
    p.removeChild(t);
  }
};

Ranger.xpath = {

  getElement: function (xpath, contextNode) {
    contextNode = contextNode || document;
    return document.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  },
  
  getElements: function (xpath, contextNode) {
    contextNode = contextNode || document;
    var iterator = document.evaluate(xpath, contextNode, null, XPathResult.ANY_TYPE, null),
        node = iterator.iterateNext(),
        nodes = [];

    while (node) {
      nodes.push(node);
      node = iterator.iterateNext();
    }

    return nodes;
  },

  getXPath: function(elt) {
    var path = "";
    
    var getElementIdx = function(elt) {
      var count = 1;
      for (var sib = elt.previousSibling; sib ; sib = sib.previousSibling) {
        if(sib.nodeType == 1 && sib.tagName == elt.tagName)	count++
      }

      return count;
    }

    for (; elt && elt.nodeType == 1; elt = elt.parentNode) {
      var idx = getElementIdx(elt),
        xname = elt.tagName;
      if (idx > 1) xname += "[" + idx + "]";
      path = "/" + xname + path;
    }

    return path.toLowerCase();	
  }
  
}