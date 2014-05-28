describe('Da Ranger', function() {
  
  it('should recognize a serialized range', function(done) {
    
    var r = {
      startContainer: "/html/body/div[2]/p/strong/em",
      startOffset: 1,
      endContainer: "/html/body/div[2]/p/em[2]",
      endOffset: 41
    }

    var ranger = new Ranger(r);

    var painted = ranger.paint("hl");
    
    painted.length.should.be.greaterThan(0);
    
    var text = ranger.toString();
    
    text.should.be.equal("it amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit");
    
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
    
    ranger.toString().should.be.equal("cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.");
    
    var serialized = ranger.toJSON();

    serialized.startContainer.should.equal(r.startContainer);
    serialized.startOffset.should.equal(r.startOffset);
    serialized.endContainer.should.equal(r.endContainer);
    serialized.endOffset.should.equal(r.endOffset);
    (serialized.commonAncestorContainer === undefined).should.be.true;
    
    done();
    
  });
  
  it('should paint even if there is another highlight', function(done) {
    
    var r = {
      startContainer: "/html/body/div/p/strong/em",
      startOffset: 1,
      endContainer: "/html/body/div/p/strong/em",
      endOffset: 3
    }
    
    new Ranger(r).paint("hl");

    r = {
      startContainer: "/html/body/div/p/strong/em",
      startOffset: 0,
      endContainer: "/html/body/div/p/strong/em",
      endOffset: 3
    }
    
    // should paint 2 textnodes in "sit": "s" & "it"
    new Ranger(r).paint("hl").length.should.be.equal(2);
    
    done();
    
  });
  
  it('should not break when provided shit', function(done) {
    done();
  });
  
  it('should not break with random start/end nodes', function(done) {
    
    var content = document.getElementById('content'),
      times = 4;
    
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
      
      console.log(ranger.toString());
      
    }
    
    done();
    
  });

  it('should not break a SVG if selected inside', function(done) {
    
    // return done();
    
    var start = document.querySelector('ellipse');
    var end = document.querySelector('filter');
    
    var r = {
      startContainer: start,
      endContainer: end,
      startOffset: 0,
      endOffset: 79
    }
    
    var painted = new Ranger(r).paint("hl");
    
    done();
    
  });
  
  it('should work with selection crossing SVG tags', function(done) {
    
    var start = document.querySelector('#one strong').childNodes[2];
    var end = document.querySelector('#three');
    
    var r = {
      startContainer: start,
      endContainer: end,
      startOffset: 2,
      endOffset: 12
    }
    
    new Ranger(r).paint("hl");
    
    done();
    
  });
  
  
  it('should work with selection across a table', function(done) {
    
    done();
    
  });
  
  it('should paint the same amount of text nodes', function(done) {
    
    return done();
    
    var r = {
      startContainer: document.querySelector('#one em'),
      endContainer: document.querySelector('#three strong'),
      startOffset: 2,
      endOffset: 12
    }
    
    var ranger = new Ranger(r);
    
    var nodes = ranger.textNodes();
    var painted = ranger.paint("hl");
    
    console.log(nodes.length);
    console.log(painted);
    
    // nodes.length.should.equal(painted.length);
    
    done();
    
    
  });
  
  
  it('should export to JSON and re-feed it into a new Ranger', function() {
    
    var r = {
      startContainer: document.querySelector('#one em'),
      endContainer: document.querySelector('#three strong'),
      startOffset: 2,
      endOffset: 12
    }
    
    var ranger = new Ranger(r);
    
    console.log(ranger.toJSON());
    
  })
  
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