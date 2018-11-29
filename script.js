class Component {
  constructor (element) {
    this.element = element;
    this.element.component = this;

    if (this.canBeDragged())
      this.makeDraggable()
  }

  // Enable native drag & drop
  // (needs shim for touch devices)
  makeDraggable() {
    this.element.setAttribute('draggable', true)
  }

  // when dragging component over another, 
  // find a closest parent that can accept dragged children
  // then find the best (closest) position in its childlist
  onDragOver(e, target) {
    //console.log('dragover', target)
    var droppable = target.getDroppableTarget(this);
    if (droppable) {
      if (droppable !== this) {
        var preview = this.preview();
        this.target = target;
        var anchor = droppable.getClosestPosition(preview.element, e.clientX + window.scrollX, e.clientY + window.scrollY)
        droppable.element.insertBefore(preview.element, anchor)
      }
    } else {
      this.target = undefined;
      this.preview().destroy()
    }
  }

  // generate preview component
  onDragStart() {
    this.preview();
  }

  // finalize preview component or discard it
  onDragEnd(e, target) {
    if (this.target) {
      this.finalize()
    } else {
      this.preview().destroy()
    }
  }

  // clone component
  clone() {
    return new this.constructor(this.element.cloneNode(true))
  }

  // detach component from DOM
  destroy() {
    if (this.element.parentNode)
      this.element.parentNode.removeChild(this.element);
  }

  // create a clone of element when dragging from sidebar
  // use component itself as preview when reodering
  preview() {
    if (this.inSidebar()) {
      if (!this.previewed) {
        this.previewed = this.clone()
        this.previewed.element.classList.add('preview')
      } 
    } else {
      this.previewed = this;
    }
    return this.previewed
  }

  // remove "preview" class from component element
  finalize() {
    if (this.previewed)
      this.previewed.element.classList.remove('preview')
    this.previewed = undefined;
  }

  // check if component was dragged from sidebar (not reordered)
  inSidebar() {
    return this.element.parentNode &&
           this.element.parentNode.classList.contains('sidebar')
  }

  // check if component is unfinialized preview
  isPreview() {
    return this.element.classList.contains('preview')
  }

  // a hook that determines if component can be dragged (canvas cant)
  canBeDragged() {
    return true;
  }

  // check if component can have given component nested 
  canAdopt(target) {
    return this.element.parentNode 
        && !this.inSidebar()
        && !this.isPreview()
        && target.element.tagName !== 'INPUT';
  }

  // find the closest parent that can accept given component
  getDroppableTarget(child) {
    for (var el = this; el; el = el.element.parentNode.component) {
      if (el.canAdopt(child))
        return el;
    }
  }

  // find best placement for element based on cursor x,y
  getClosestPosition(element, x, y) {
    // generate a fake last element position
    var lastElement = this.element.lastElementChild;
    if (lastElement) {
      var lastPlacement = {
        last: lastElement,
        offsetParent: this.element,
        offsetLeft: lastElement.offsetLeft,
        offsetTop: lastElement.offsetTop + lastElement.offsetHeight,
        offsetHeight: lastElement.offsetHeight
      }
    } else {
      lastPlacement = this.element;
    }

    // produce a list of positions to test
    var nodes = Array.prototype.slice.call(this.element.childNodes)
               .concat(lastPlacement);

    // remove dragged element itself from the list
    var position = nodes.indexOf(element);
    if (position > -1)
      nodes.splice(position, 1)

    // sort elements by proximity to cursor
    nodes.sort((a, b) => {
      return this.getDistanceToElement(a, x, y) - this.getDistanceToElement(b, x, y)
    })

    var closest = nodes[0]
    if (closest != lastPlacement)
      return closest//.nextSibling;
  }

  // compute absolute x,y of an element on the page
  getElementXY(element) {
    var offsetX = 0;
    var offsetY = 0;

    for (var el = element; el; el = el.offsetParent) {
      //offsetX += el.offsetLeft;
      offsetY += el.offsetTop;
    }

    return {x: offsetX, y: offsetY}
  }

  // compute element's top left corner distance towards cursor
  getDistanceToElement(element, x, y) {
    var xy = this.getElementXY(element);
    return Math.sqrt(Math.pow(xy.x - x, 2) + Math.pow(xy.y - y, 2), 2)
  }
}


// Images cant accept children
Component.IMG = class extends Component {
  canAdopt() {
    return false;
  }
}

// Inputs cant accept children
Component.INPUT = class extends Component {
  canAdopt() {
    return false;
  }
}

// Spans cant accept children 
// (perhaps image, but it's harder to deal with textnodes)
Component.SPAN = class extends Component {
  canAdopt() {
    return false;
  }
}

// forms cant be nested, only place that accepts inputs
Component.FORM = class extends Component {
  canAdopt(target) {
    return this.element.parentNode 
        && !this.inSidebar()
        && !this.isPreview()
        && target.element.tagName !== 'FORM';
  }
}

// Canvas can not be dragged
class Canvas extends Component {
  canBeDragged() {
    return false;
  }
}

// Sidebar can not be dragged
class Sidebar extends Component {
  canBeDragged() {
    return false;
  }
  canAdopt() {
    return false;
  }
}


// delegate drag events to document itself
document.addEventListener('dragstart', function(e) {
  if (Component.dragged !== e.target.component) {
    Component.dragged = e.target.component;
    e.target.component.onDragStart(e, e.target.component)
  }
})
document.addEventListener('dragend', function(e) {
  Component.dragged.onDragEnd(e)
  Component.dragged = undefined;
})
document.addEventListener('dragover', function(e) {
  var component = e.target.component;
  if (component && Component.dragged)
    Component.dragged.onDragOver(e, e.target.component);
})

// Initialize canvas and components
document.addEventListener('DOMContentLoaded', function() {
  
  var canvas = new Canvas(document.querySelector('.canvas'))
  var sidebar = new Sidebar(document.querySelector('.sidebar'))

  Array.prototype.forEach.call(document.querySelectorAll('.component'), function(component) {
    // find subclass based on element tag
    if (Component[component.tagName])
      new Component[component.tagName](component)
    else
      new Component(component)
  })
})