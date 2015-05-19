# Ranger

A small Javascript utility to grab, wrap and serialize ranges of text nodes.

The goal of this library is to be a small and resilient tool that gets one thing done well.

It does not have any dependency besides `wgxpath` if parsing serialized (XPath) ranges in IE is required, in which case it must be `install()`ed before using Ranger. No, it does not require jQuery.

Ranger consistently finds the best selection for the supplied Range specification. In a 10-character node, it will not fail with offsets (1, 3000) but the resulting selection length will obviously not be 2999 (it will be 9). Ranger is sensitive to any whitespace change within text nodes.

## Installation

**Bower**: `bower install ranger-js`.

## Support

It works in modern browsers.

Tested on latest Chrome, Chromium, Firefox, Safari, IE 9/10/11, Opera for Windows 8, Android stock browser, Chrome for Android, Chrome for iPhone, iPad mobile Safari.

## Basic usage

```js

// Prepare a range, that consists of the four listed properties

// Start/end containers can be either one of: DOM Node (including text nodes) or an XPath to the element
// Start/end offsets must be positive integers

var range = {
  startContainer: $('#content strong')[0], // or: "/html/body/div/p/strong"
  startOffset: 1,
  endContainer: $('#content strong').eq(1).contents()[0],
  endOffset: 17
}

// as well as the Range DOM API

range = window.getSelection().getRangeAt(0);

// Instantiate Ranger

var ranger = new Ranger(range, options);

// Configuration options

{
  // the root node from where XPaths should be calculated (in case of working with an iframe, supply the new document)
  context: node,
  
  // a querySelector-compatible selector whose selection will be skipped when serializing
  ignoreSelector: ".noselect, .noselect *" // to ignore the node(s) and all their children
  
} 

// Get the text nodes defined in that range

ranger.textNodes(); // returns an array

// Paint the nodes (wraps an element around each text node) (Tip: add this CSS: .ranger-hl { background: rgba(255,255,10,0.5); } )

ranger.paint();  // or supply a DOM element as argument to act as a wrapper

// Return a hash of the current range, included by default on all nodes on a data-* attribute

ranger.id; // the hash

Ranger.DATA_ATTR; // the data attribute name, "data-ranger-hl";

// Serialize to XPath

var json = ranger.toJSON();

new Ranger(json).toJSON() === json; // true

// Stringify

ranger.toString(); // content of text nodes in range, trimmed

// Remove wrapping

ranger.unpaint();

```

## Documentation

For now, [look at the tests](https://github.com/frank06/ranger/blob/master/test/tests.js).

## Wishlist

 - Snap to words
 - Track changes, infer new possible position when DOM is changed (via xmldiff)

## License

Copyright ©2015 github.com/frank06

Licensed under the MIT license.