var hl = function() {
  var wrapper = document.createElement('span');
  wrapper.className = "ranger-hl";
  return wrapper;
}();

var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = '.ranger-hl { background: rgba(255,255,10,0.5); }';
document.getElementsByTagName('head')[0].appendChild(style);

// chrome.storage.local.remove(window.location.href);

chrome.storage.local.get(window.location.href, function(data) {
  if (!data[window.location.href]) return;
  data[window.location.href].forEach(function(range) {
    new Ranger(range).paint(hl);
  })
});

document.onkeyup = function(e) {
  
  if (e.which == 72) {
    
    if (window.getSelection() && window.getSelection().rangeCount > 0) {
      range = window.getSelection().getRangeAt(0);
      
      if (range.collapsed) {
        Ranger.utils.unpaintBySampleNode(range.startContainer);
        return;
      }
      
      var ranger = new Ranger(range);
      
      addRange(ranger.toJSON());

      ranger.paint(hl);
      window.getSelection().removeAllRanges();
    }
    
  }
  
};

var addRange = function(range) {
  
  chrome.storage.local.get(window.location.href, function(dictionary) {
    
    dictionary[window.location.href] = dictionary[window.location.href] || [];
    
    dictionary[window.location.href].push(range);
    chrome.storage.local.set(dictionary);
    
  });
  
};