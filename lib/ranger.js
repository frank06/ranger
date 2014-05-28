var Ranger = function(range) {
  
  var isInteger = function(n) { return typeof n === 'number' && (n % 1) === 0 };
  
  if (!range || range.collapsed) {
    this._textNodes = [];
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
    var temp = start;
    start = end;
    end = temp;
  }
  
  // Determine start and end text nodes

  start = Ranger._findTextNode(start, startOffset) || start;
  end = Ranger._findTextNode(end, endOffset) || end;
  
  if (!start || !end) throw new Error("Invalid node/offset", this.toJSON());
  
  // Determine edge nodes and offset
  
  var newRange = {};
  
  if (isTextNode(start)) {
    if (startOffset > start.nodeValue.length) startOffset = start.nodeValue.length;
    newRange.start = start.splitText(startOffset);
  } else {
    newRange.start = start;
  }
  
  if (start == end) {
    if (isTextNode(newRange.start) && (endOffset - startOffset) < newRange.start.nodeValue.length) {
      newRange.start.splitText(endOffset - startOffset);
    }
    newRange.end = newRange.start;
  } else {
    if (isTextNode(end)) {
      if (endOffset > end.nodeValue.length) endOffset = end.nodeValue.length;
      end.splitText(endOffset);
    }
    newRange.end = end;
  }
  
  this._range.startOffset = startOffset;
  this._range.endOffset = endOffset;
  
  // Collect text nodes
  
  var occured = { start: false, end: false };
  
  this._textNodes = Ranger.collectTextNodes(container, newRange.start, newRange.end, occured);
  
};

Ranger.prototype.textNodes = function() {
  return this._textNodes;
}

Ranger.prototype.paint = function(wrapperClass) {
  
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

Ranger.prototype.unpaint = function(wrapperClass) {
  
  
  
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
    
    var parent;
    
    if (elem.nodeType === 3) {
      parent = elem.parentNode;
      while (parent.className === ignoreClassName) parent = parent.parentNode;
    } else if (elem.nodeType === 1) {
      parent = elem;
    }
    
    return Ranger.xpath.getXPath(parent, context);
    
  }.bind(this);
  
  var start = serialize(this._range.startContainer),
    end = serialize(this._range.endContainer);

  return {
    startContainer: start,
    startOffset: this._range.startOffset,
    endContainer: end,
    endOffset: this._range.endOffset
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

Ranger._findTextNode = function(elem, offset) {
  
  if (!elem || (elem instanceof SVGElement)) return null;
  if (elem.nodeType === 3) return elem;
  
  var count = 0, offset = offset || 0,
    i = 0, node;
    
  var nodes = Ranger.collectTextNodes(elem);
  
  if (nodes.length === 0) return elem;
    
  do {
    node = nodes[i]; i++;
    count += node.nodeValue.length;
  } while (count < offset && nodes[i]);
  
  return node;
  
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