(function() {
  
  var Ranger = function(range, options) {
  
    if (!range || range.collapsed) {
      return; 
    }
  
    // Initialize
  
    options = options || {};
    this._range = {};
  
    // Attempt to find nodes, even when in array or jQuery object
  
    this._range.startContainer = Ranger.utils.getNode(range.startContainer);
    this._range.endContainer = Ranger.utils.getNode(range.endContainer);
    this._range.startOffset = range.startOffset;
    this._range.endOffset = range.endOffset;
  
    this._range.commonAncestorContainer = Ranger.utils.getNode(range.commonAncestorContainer);
    options.context = Ranger.utils.getNode(options.context);
  
    // Options
  
    this._range.context = options.context;
    this._range.ignoreSelector = options.ignoreSelector;
  
    if (this._range.context instanceof HTMLDocument) {  // supplied context is, for example, an iframe doc
      this._range.document = this._range.context;
    } else if (this._range.context) {  // supplied context is a node, get its document
      this._range.document = this._range.context.ownerDocument;
    } else {  // no supplied context
      this._range.document = document;
    }
  
    // Find start/end nodes
  
    if (typeof this._range.startContainer === 'string') {
      this._range.startContainer = Ranger.utils.xpath.getElement(this._range.startContainer, this._range.context, this._range.document);
    }
  
    if (typeof this._range.endContainer === 'string') {
      this._range.endContainer = Ranger.utils.xpath.getElement(this._range.endContainer, this._range.context, this._range.document);
    }
  
    // Validate
  
    if (!this._range.startContainer || !this._range.endContainer ||
        !Ranger.utils.isInteger(this._range.startOffset) ||
        !Ranger.utils.isInteger(this._range.endOffset)) {
      throw new Error("Invalid range");
    }
  
    // Determine common ancestor node
  
    if (!this._range.commonAncestorContainer) {
      var parent = this._range.startContainer.parentNode;
      while (parent && !Ranger.utils.containsNode(parent, this._range.endContainer)) {
        parent = parent.parentNode;
      }
      this._range.commonAncestorContainer = parent;
    }
  
    // Calculate text nodes  
  
    var start = this._range.startContainer,
      startOffset = this._range.startOffset,
      end = this._range.endContainer,
      endOffset = this._range.endOffset,
      container = this._range.commonAncestorContainer;
    
    // Determine order, swap if order is inverted; take into account swaps in same node (start == end)
  
    if (start.compareDocumentPosition(end) === Node.DOCUMENT_POSITION_PRECEDING) {
      var temp = start,
        tempOffset = startOffset;
      start = end;
      end = temp;
      startOffset = endOffset;
      endOffset = tempOffset;
    }
  
    if (start == end && startOffset > endOffset) {
      var temp = startOffset;
      startOffset = endOffset;
      endOffset = temp;
    }
      
    // Determine start and end text nodes

    var d1 = Ranger.utils.findDeepestNode(start, startOffset),
      d2 = Ranger.utils.findDeepestNode(end, endOffset);
    
    start = d1[0];
    startOffset = d1[1];
    end = d2[0];
    endOffset = d2[1];
  
    if (!start || !end) throw new Error("Invalid node/offset", this.toJSON());
  
    // Determine if the browser is a piece of shit or not
  
    var probeDiv = this._range.document.createElement("div");
    probeDiv.innerHTML = "<!--[if IE 9]><script id='ie9'></script><![endif]-->";
    this.isIE9 = probeDiv.firstChild.id == 'ie9';
  
    // Determine edge nodes and offset
  
    var newRange = {};
  
    if (Ranger.utils.isTextNode(start)) {
      newRange.start = start.splitText(startOffset);
      this.ie9Workaround(start);
    } else {
      newRange.start = start;
    }
  
    if (start == end) {
      if (Ranger.utils.isTextNode(newRange.start)) {
        var offset = Math.abs(endOffset - startOffset);
        newRange.start.splitText(offset);
        this.ie9Workaround(newRange.start);
      }
      newRange.end = newRange.start;
    } else {
      if (Ranger.utils.isTextNode(end)) {
        end.splitText(endOffset);
        this.ie9Workaround(end);
      }
      newRange.end = end;
    }
  
    // Collect text nodes
  
    var occured = { start: false, end: false };
  
    this._textNodes = Ranger.utils.collectTextNodes(container, newRange.start, newRange.end, occured);
  
    // Ensure id is available

    this.id = this.toJSON().id;
  
  };

  Ranger.prototype.textNodes = function() {
    return this._textNodes;
  };

  Ranger.prototype.paint = function(wrapper) {

    // Offer a default painting element
  
    if (!wrapper || !(wrapper instanceof Node)) {
      wrapper = this._range.document.createElement('mark');
      wrapper.className = Ranger.PAINT_CLASS;
    }
  
    return this._textNodes.map(function(node) {
    
      var parent = node.parentNode;
    
      wrapper = wrapper.cloneNode();
    
      wrapper.setAttribute(Ranger.DATA_ATTR, this.id);
    
      parent.replaceChild(wrapper, node);
      wrapper.appendChild(node);
    
      return wrapper;
    
    }.bind(this));
  
  };

  Ranger.prototype.unpaint = function() {
    return Ranger.utils.unpaintBySampleNode(this._textNodes[0]);
  };

  Ranger.prototype.toString = function(nodes) {
    return Ranger.utils.toString(this._textNodes).trim();
  };

  Ranger.prototype.toJSON = function() {
  
    if (!this._range) return {};
    if (this._json) return this._json; // cache computation
  
    var serialize = function(elem) {
    
      var parent,
        offset = 0,
        skipSelector = '[' + Ranger.DATA_ATTR + ']';
    
      if (this._range.ignoreSelector) skipSelector = skipSelector + "," + this._range.ignoreSelector;
      var skipElements = [].slice.call(this._range.document.querySelectorAll(skipSelector));
    
      if (elem.nodeType === 3) {
        parent = elem.parentNode;
      
        // skip Ranger and other ignorable nodes
        while (~skipElements.indexOf(parent)) {
          parent = parent.parentNode;
        }
      
        var textNodes = Ranger.utils.collectTextNodes(parent);
        textNodes = textNodes.slice(0, textNodes.indexOf(elem));

        offset = textNodes.reduce(function(acc, child) {
          return acc += child.nodeValue.length;
        }, 0);
      
      } else if (elem.nodeType === 1) {
        parent = elem;
      }
    
      var xpath = Ranger.utils.xpath.getXPath(parent, this._range.context, skipElements, this._range.document);
    
      return [xpath, offset];
    
    }.bind(this);
  
    var start = serialize(this._range.startContainer),
      end = serialize(this._range.endContainer);

    this._json = {
      startContainer: start[0],
      startOffset: start[1] + this._range.startOffset,
      endContainer: end[0],
      endOffset: end[1] + this._range.endOffset
    }
  
    // Calculate hash
  
    this._json.id = Ranger.utils.hashRange(this._json);
  
    return this._json;
  
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

  // Constants

  Ranger.DATA_ATTR = "data-ranger-hl";
  Ranger.PAINT_CLASS = "ranger-hl";

  // Utils

  Ranger.utils = {
  
    getNode: function(node) {
      return (Array.isArray(node) || (node && typeof node.selector == 'string' && node.length !== undefined)) ? node[0] : node;
    },
  
    isInteger: function(n) {
      return typeof n === 'number' && (n % 1) === 0
    },
  
    isTextNode: function(node) {
      return node.nodeType === 3
    },
  
    hashRange: function(range) {
    
      var asString = true,
        seed = undefined,
        str = [
          range.startContainer,
          range.startOffset,
          range.endContainer,
          range.endOffset
        ].join('|');

      /**
       * Calculate a 32 bit FNV-1a hash
       * Found here: https://gist.github.com/vaiorabbit/5657561
       * Ref.: http://isthe.com/chongo/tech/comp/fnv/
       *
       * @param {string} str the input value
       * @param {boolean} [asString=false] set to true to return the hash value as 
       *     8-digit hex string instead of an integer
       * @param {integer} [seed] optionally pass the hash of the previous chunk
       * @returns {integer | string}
       */
      var i, l,
        hval = (seed === undefined) ? 0x811c9dc5 : seed;

      for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
      }
    
      if(asString) {
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
      }
    
      return hval >>> 0;
    
    },
  
    collectTextNodes: function(elem, start, end, occured) {

      if (elem.nodeType === 3) elem = elem.parentNode;

      var children = Array.prototype.slice.call(elem.childNodes),
        occured = occured || { start: true, end: false };

      return children.reduce(function(nodes, child) {

        if (occured.end || (child instanceof SVGElement)) return nodes;

        if (child == start) occured.start = true;
        if (child == end) occured.end = true;

        if (occured.start && child.nodeType === 3) {
          nodes.push(child);
        } else if (child.nodeType === 1) {
          nodes = nodes.concat(Ranger.utils.collectTextNodes(child, start, end, occured));
        }

        return nodes;

      }, []);

    },
  
    findDeepestNode: function(elem, offset) {

      if (elem instanceof SVGElement) return [elem, 0];
      if (elem.nodeType === 3) {
        if (offset > elem.nodeValue.length) offset = elem.nodeValue.length;
        return [elem, offset];
      }

      var accumulated = 0, i = 0, node;

      var nodes = Ranger.utils.collectTextNodes(elem);

      if (nodes.length === 0) return [elem, 0]; // elem doesn't have text nodes

      var nodeLength = Ranger.utils.toString(nodes).length;
      if (offset > nodeLength) offset = nodeLength;

      do {
        node = nodes[i]; i++;
        accumulated += node.nodeValue.length;
      } while (accumulated < offset);

      var previousTextNodesLength = accumulated - node.nodeValue.length, // accumulated - current node
        newOffset = offset - previousTextNodesLength;

      return [node, newOffset];

    },
  
    unpaint: function(nodes) {
    
      return [].map.call(nodes, function(element) {
        var parent = element.parentNode;
          var current = element.firstChild, next;
          do {
            next = current.nextSibling;
            parent.insertBefore(current, element);
          } while ((current = next));
          return parent.removeChild(element);
      });
    
    },
  
    unpaintBySampleNode: function(node) {
    
      var id = node.parentNode.getAttribute(Ranger.DATA_ATTR);
      if (!id) return;
    
      var nodes = node.ownerDocument.querySelectorAll('[' + Ranger.DATA_ATTR + '="' + id + '"]');
    
      Ranger.utils.unpaint(nodes);
    
      return id;
    
    },
  
    containsNode: function(n1, n2) {
      return n1.compareDocumentPosition(n2) & Node.DOCUMENT_POSITION_CONTAINED_BY;
    },
  
    toString: function(nodes) {
      return nodes.reduce(function(s, current) {
        return s += current.textContent; 
      }, "");
    },
  
    xpath: {

      getElement: function (xpath, contextNode, doc) {
        doc = doc || document;
        contextNode = contextNode || doc;
        return doc.evaluate(xpath, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      },

      getElements: function (xpath, contextNode, doc) {
        doc = doc || document;
        contextNode = contextNode || doc;
        var iterator = doc.evaluate(xpath, contextNode, null, XPathResult.ANY_TYPE, null),
            node = iterator.iterateNext(),
            nodes = [];

        while (node) {
          nodes.push(node);
          node = iterator.iterateNext();
        }

        return nodes;
      },

      getXPath: function(elem, contextNode, ignoreNodes, doc) {
      
        var path = "";
      
        doc = doc || document;
        contextNode = contextNode || doc;
        ignoreNodes = ignoreNodes || [];
      
        var index = function(elem) {
            var count = 1;
            for (var previous = elem.previousSibling; previous; previous = previous.previousSibling) {
              if (previous.nodeType == 1 && previous.tagName == elem.tagName) count++;
            }
            return count;
          }

        for (; elem && elem.nodeType == 1 && elem !== contextNode; elem = elem.parentNode) {
          if (~ignoreNodes.indexOf(elem)) continue;
          var i = index(elem),
            name = elem.tagName;
          if (i > 1) name += "[" + i + "]";
          path = "/" + name + path;
        }

        if (contextNode !== doc) path = "." + path;
        return path.toLowerCase();
      
      }

    }
  
  }

  // Optionally define AMD
  
  if (typeof window.define === "function" && window.define.amd) {
    window.define("ranger", [], function() {
      return Ranger;
    });
  } else {
    window.Ranger = Ranger;
  }
    
}.call(this));