# Ranger

A small Javascript utility to grab, wrap and serialize ranges of text nodes.

The goal of this library is to be a small and resilient tool that gets one thing done well.

It does not have any dependency besides `wgxpath` if parsing serialized (XPath) ranges in IE is required, in which case it must be `install()`ed before using Ranger. No, it does not require jQuery.

## Support

It works in modern browsers.

Tested on latest Chrome, Chromium, Firefox, Safari, IE 9/10/11, Opera for Windows 8, Android stock browser, Chrome for Android, Chrome for iPhone, iPad mobile Safari.

## Documentation

For now, look at the tests.

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

// Instantiate Ranger

var ranger = new Ranger(ranger);

// Get the text nodes defined in that range

ranger.textNodes(); // returns an array

// Paint the nodes (wraps an element around each text node)

ranger.paint();  // it's possible to supply as argument a DOM element to act as a wrapper

// (Tip: add this CSS: .ranger-hl { background: rgba(255,255,10,0.5); } )

// Return a hash of the current range

ranger.id; // included as data- attribute in all wrapper nodes

// Serialize to XPath

var json = ranger.toJSON();

new Ranger(json).toJSON() === json; // true

// Stringify

ranger.toString(); // content of text nodes in range

// Remove wrapping

ranger.unpaint();


```

## License

Copyright © 2014 github/frank06

Licensed under the MIT license.