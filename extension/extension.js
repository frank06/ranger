var hl = function() {
  var wrapper = document.createElement('span');
  wrapper.className = "ranger-hl";
  return wrapper;
}();

var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = '.ranger-hl { background: rgba(255,255,10,0.5); }';
document.getElementsByTagName('head')[0].appendChild(style);
  
document.onkeyup = function(e) {
  
  if (e.which == 72) {
    
    if (window.getSelection() && window.getSelection().rangeCount > 0) {
      range = window.getSelection().getRangeAt(0);
      
      if (range.collapsed) {
        Ranger.utils.unpaintBySampleNode(range.startContainer);
        return;
      }
      
      var ranger = new Ranger(range);
      ranger.paint(hl);
      window.getSelection().removeAllRanges();
    }
    
  }
  
};