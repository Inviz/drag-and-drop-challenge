# Drag & Drop trees

A challenge for sortable/draggable tree of components.

It does not have any dependencies, drag & drop is implemented via native `draggable` event.

## Reasoning

The challenge in question did not call to use any specific framework, so I decided to go with Vanilla.js.

First of all, I wanted to demonstrate that I have very detailed knowledge of how DOM works, how to leverage built in functionality and how to make things efficient. 

Using the library makes sense in many cases, but it sometimes makes it difficult to customize the logic and ensure high performance. Going through react state lifecycle and tree reconciliation can be very costly on big trees. It could be possible to make all drag & drop preview and reordering outside of the virtual DOM, and only commit changes when interaction is finished. 

## Details

The code uses simple Component class for both canvas and component prototypes in sidebar. When user drags component for sidebar, it creates a preview clone and injects it onto the canvas, it stays semi-transparent until the end of interaction. When user reorders components in the canvas, there's no preview and instead the action is applied immediately. Components have subclasses for different tag names, so that they can have different rules for nesting. The rules are as following:

* `Span, img, input` can not have any children
* `form`s can not be nested into each other
* `input` can be only nested into form

When user drags component around, the code tries to find closest parent component that can accept the dragged component, and then tries to find the best position for it (as close as possible to cursor). It is possible to drag tree with children around. 

Drag events are delegated to document, so there's only a single listener for each type of event. 


## Caveats

* **It needs drag events shim in order for touch events to work, because touch devices do not natively implement draggable attribute support. ** It's trivial to do so by using library like https://github.com/timruffles/mobile-drag-drop
* Safari without shim does not allow to drag inputs. It is necessary to wrap input tag into a div in order to work properly.
