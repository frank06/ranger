var hl = function() {
  var wrapper = document.createElement('span');
  wrapper.className = "ranger-hl";
  return wrapper;
}();

var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = '.ranger-hl { background: rgba(255,255,10,0.5); cursor: default }';
document.getElementsByTagName('head')[0].appendChild(style);

// chrome.storage.local.remove(window.location.href);

chrome.storage.local.get(window.location.href, function(data) {
  var storage = data[window.location.href];
  if (!storage) return;
  
  // console.log(Object.keys(storage));
  
  Object.keys(storage).forEach(function(key) {
    var range = storage[key];
    new Ranger(range).paint(hl);
  });
  
});

document.onkeyup = function(e) {
  
  if (e.which == 72) {
    
    if (window.getSelection() && window.getSelection().rangeCount > 0) {
      range = window.getSelection().getRangeAt(0);
      
      if (range.collapsed) {
        var id = Ranger.utils.unpaintBySampleNode(range.startContainer);
        removeRange(id);
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
  
  chrome.storage.local.get(window.location.href, function(storage) {
    
    storage[window.location.href] = storage[window.location.href] || {};
    
    storage[window.location.href][range.id] = range;
    chrome.storage.local.set(storage);
    
  });
  
};

var removeRange = function(id) {
  
  chrome.storage.local.get(window.location.href, function(storage) {
    
    delete storage[window.location.href][id]; 
    
    chrome.storage.local.set(storage);
    
  });
  
};