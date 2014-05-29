describe('Da Ranger', function() {
  
  it('should ignore when no ranged is supplied', function(done) {
    
    expect(new Ranger().textNodes()).to.equal(undefined);
    
    done();
    
  });
  
  it('should not bound the offset to the maximum possible value for node', function(done) {
    
    var r = {
      startContainer: $('#content strong')[0],
      startOffset: 1,
      endContainer: $('#content strong').eq(1).contents()[0],
      endOffset: 3000
    }
    
    var serialized = new Ranger(r).toJSON();

    // internally we work with the node's length (18) but the serialized returns 3000
    expect(serialized).to.have.property('endOffset').equal(3000);
    
    done();
    
  });
  
  it('should correctly swap nodes to the right start/end', function(done) {
    
    var r = {
      startContainer: $('#content strong').eq(1).contents()[0],
      startOffset: 18,
      endContainer: $('#content strong')[0],
      endOffset: 1
    }
    
    var ranger = new Ranger(r);
    // ranger.paint("hl");
    var serialized = ranger.toJSON();
    
    expect(serialized.startContainer).to.equal(Ranger.xpath.getXPath($('#content strong')[0]));
    expect(serialized.startOffset).to.equal(1);
    expect(serialized.endContainer).to.equal(Ranger.xpath.getXPath($('#content strong')[1]));
    expect(serialized.endOffset).to.equal(18);
    
    done();
    
  });
  
  it('should recognize a serialized range', function(done) {
    
    var r = {
      startContainer: "/html/body/div/p/strong/em",
      startOffset: 1,
      endContainer: "/html/body/div/p/strong",
      endOffset: 10
    }
    
    // endContainer: "/html/body/div/p/em[2]",
    // endOffset: 41

    var ranger = new Ranger(r);

    var painted = ranger.paint("hl");
    
    return done();
    
    expect(painted.length).to.be.greaterThan(0);
    
    var text = ranger.toString();
    
    expect(text).to.equal("it amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit");
    
    done();
    
  });
    
  it('should equal its serialized counterpart', function(done) {
    
    var r = {
      startContainer: "/html/body/div[2]/p/strong[2]",
      startOffset: 9,
      endContainer: "/html/body/div[2]/p[2]",
      endOffset: 0
    }
    
    var ranger = new Ranger(r);
    ranger.paint('hl');
    
    expect(ranger.toString()).to.equal("cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
    
    var serialized = ranger.toJSON();

    expect(serialized.startContainer).to.equal(r.startContainer);
    expect(serialized.startOffset).to.equal(r.startOffset);
    expect(serialized.endContainer).to.equal(r.endContainer);
    expect(serialized.endOffset).to.equal(r.endOffset);
    expect(serialized.commonAncestorContainer).to.equal(undefined);
    
    done();
    
  });
  
  it('should paint even if there is another highlight', function(done) {
    
    var r = {
      startContainer: "/html/body/div[2]/p/strong[1]",
      startOffset: 1,
      endContainer: "/html/body/div[2]/p/strong[1]",
      endOffset: 3
    }
    
    new Ranger(r).paint("hl");

    r = {
      startContainer: "/html/body/div[2]/p/strong[1]",
      startOffset: 0,
      endContainer: "/html/body/div[2]/p/strong[1]",
      endOffset: 3
    }
    
    // should paint 2 textnodes in "dolor": "d" & "ol"
    // we use greater than, because highlights from other tests could be influencing the result
    expect(new Ranger(r).paint("hl").length).to.be.greaterThan(1);
    
    done();
    
  });
  
  it('should throw an exception when provided shit', function(done) {
    
    expect(function() {
    
      var r = {
        startContainer: "zzzz1]",
        startOffset: "z",
        endContainer: "----",
        endOffset: null
      }
    
      new Ranger(r).toJSON();
    
    }).to.throw(Error);
    
    done();
    
  });
  
  it('should highlight correctly from non-textnode to non-textnode', function() {
    
    var r = {
      startContainer: "/html/body/div[2]/p[2]/img",
      startOffset: 0,
      endContainer: "/html/body/div[2]/hr",
      endOffset: 0
    }

    var ranger = new Ranger(r),
      painted = ranger.paint("hl");

    expect(painted.length).to.be.greaterThan(0);
    
    expect(ranger.toString()).to.equal("Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
    
  });
  
  it('should not break with random start/end nodes', function(done) {
    
    var content = document.getElementById('content'),
      times = 9;
  
    for (var i = 0; i < times; i++) {
    
      // Prepare nodes, filter out highlight spans, and concat with an only-text node list
      // so that text nodes have more weight in the shuffle
    
      var nodes = getAllNodes(content).filter(function(e) { return e.className != 'hl' })
        .concat(getAllNodes(content, true))
        .concat(getAllNodes(content, true));
    
      var shuffledNodes = shuffleArray(nodes);
    
      var start = shuffledNodes[0],
        end = shuffledNodes[shuffledNodes.length - 1];
    
      var r = {
        startContainer: start,
        endContainer: end,
        startOffset: randomIntMax(start.textContent.length),
        endOffset: randomIntMax(end.textContent.length)
      }

      var ranger = new Ranger(r);

      ranger.paint("hl");
    
    }

    done();
    
  });

  it('should not select any SVG text nodes', function(done) {
    
    var start = document.querySelector('ellipse');
    var end = document.querySelector('filter');
    
    var r = {
      startContainer: start,
      endContainer: end,
      startOffset: 0,
      endOffset: 79
    }
    
    var painted = new Ranger(r).paint("hl");
    
    expect(painted.length).to.equal(0);
    
    done();
    
  });
  
  it('should work with selection crossing SVG tags', function(done) {
    
    var s = Ranger._findDeepestNode($('p')[2], 438);
    
    var r = {
      startContainer: s[0],
      endContainer: $('p')[3],
      startOffset: s[1],
      endOffset: 5
    }
    
    var painted = new Ranger(r).paint("hl");
    expect(painted.length).to.be.greaterThan(0);
    
    done();
    
  });
    
  it('should paint the same amount of text nodes', function(done) {
    
    var r = {
      startContainer: document.querySelector('#one em'),
      endContainer: document.querySelector('#three strong'),
      startOffset: 2,
      endOffset: 6
    }
    
    var ranger = new Ranger(r);
    
    var nodes = ranger.textNodes();
    var painted = ranger.paint("hl");
    
    expect(painted.length).to.equal(nodes.length);
    
    done();
    
  });
  
});

// Utilites

var getAllNodes = function(elem, onlyText) {
  
  var children = Array.prototype.slice.call(elem.childNodes),
    onlyText = onlyText || false;
  
  return children.reduce(function(nodes, child) {

    if (!onlyText || child.nodeType === 3) {
      nodes.push(child);
    } else if (child.nodeType === 1) {
      nodes = nodes.concat(getAllNodes(child, onlyText));
    }
    
    return nodes;
    
  }, []);
  
};

var shuffleArray = function(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

var randomIntMax = function(max) {
  return Math.floor(Math.random() * (max + 1));
}