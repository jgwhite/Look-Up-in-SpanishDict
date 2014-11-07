HTMLElement.prototype.cumulativeOffset = function () {
  var element = this;
  var result = { top: 0, left: 0 };
  do {
    result.top += element.offsetTop  || 0;
    result.left += element.offsetLeft || 0;
    element = element.offsetParent;
  } while (element);
  return result;
}

spanishdict = {};

spanishdict.receiveMessage = function (event) {
  switch (event.name) {
  case "getSelection":
    spanishdict.sendSelection();
    break;
  case "highlightSelection":
    spanishdict.highlightSelection();
    break;
  case "showDefinition":
    spanishdict.showDefinition(event.message);
    break;
  }
}

spanishdict.sendSelection = function () {
  safari.self.tab.dispatchMessage(
    "receiveSelection",
    spanishdict.getSelection()
  );
}
spanishdict.getSelection = function () {
  var selection = window.getSelection();
  spanishdict.__selection__ = selection;
  return selection.getRangeAt(0).cloneContents().textContent;
}
spanishdict.highlightSelection = function () {
  spanishdict.close();

  var selection = spanishdict.__selection__;
  var range = selection.getRangeAt(0);
  var word = range.extractContents().textContent;
  var span = document.createElement("span");
  span.className = "jgwhite_spanishdict_insert";
  span.innerHTML = word;

  range.insertNode(span);

  var definition = document.createElement("span");
  definition.className = "jgwhite_spanishdict_definition";

  var definitionHeading = document.createElement("span");
  definitionHeading.className = "jgwhite_spanishdict_definition_heading";

  var definitionBody = document.createElement("span");
  definitionBody.className = "jgwhite_spanishdict_definition_body";
  definitionBody.innerHTML = "Looking up definition&hellip;";

  var definitionLinkContainer = document.createElement("span");
  definitionLinkContainer.className = "jgwhite_spanishdict_definition_link_container";

  var definitionLink = document.createElement("a");
  definitionLink.href = "http://spanishdict.com/translate/" + word.toLowerCase();
  definitionLink.target = "_blank";
  definitionLink.innerHTML = "Open in SpanishDict &raquo;";

  definitionLinkContainer.appendChild(definitionLink);

  definition.appendChild(definitionHeading);
  definition.appendChild(definitionBody);
  definition.appendChild(definitionLinkContainer);

  var position = { top: 0, left: 0 };
  var definitionParent = span;

  while (true) {
    var overflow = window.getComputedStyle(definitionParent).overflow;

    if (
      definitionParent === document.body ||
      (overflow !== "hidden" && overflow !== "visible" && (
        (definitionParent.scrollHeight > definitionParent.offsetHeight) ||
        (definitionParent.scrollWidth > definitionParent.offsetWidth)
      ))
    ) {
      break;
    } else {
      position.top += (definitionParent.offsetTop || 0);
      position.left += (definitionParent.offsetLeft || 0) + (parseInt(window.getComputedStyle(definitionParent).borderLeftWidth) || 0);
      definitionParent = definitionParent.offsetParent;
    }
  }

  definitionParent.appendChild(definition);

  if (position.left + definition.offsetWidth < definitionParent.offsetWidth + definitionParent.scrollLeft) {
    definition.style.left = position.left + "px";
  } else {
    definition.style.left = (position.left + span.offsetWidth - definition.offsetWidth) + "px";
    definition.className = definition.className + " jgwhite_spanishdict_toleft";
  }

  if (definitionParent === document.body) {
    var verticalLimit = window.innerHeight + document.body.scrollTop;
  } else {
    var verticalLimit = definitionParent.offsetHeight + definitionParent.scrollTop;
  }

  if (position.top + definition.offsetHeight < verticalLimit) {
    definition.style.top = (position.top + span.offsetHeight) + "px";
  } else {
    definition.style.top = (position.top - definition.offsetHeight) + "px";
    span.className = span.className + " jgwhite_spanishdict_ontop";
    definition.className = definition.className + " jgwhite_spanishdict_ontop";
  }

  spanishdict.current = {
    span: span,
    definition: definition,
    word: word
  };

  document.addEventListener("click", spanishdict.closeClick, true);
}
spanishdict.close = function () {
  if (!spanishdict.current) return;

  spanishdict.current.span.parentNode.replaceChild(
    document.createTextNode(spanishdict.current.word),
    spanishdict.current.span
  );
  spanishdict.current.definition.parentNode.removeChild(
    spanishdict.current.definition
  );

  spanishdict.current = null;
}
spanishdict.closeClick = function (event) {
  var target = event.target;

  while (target) {
    if (target === spanishdict.current.definition || target === spanishdict.current.span) return;
    else target = target.parentNode;
  }

  spanishdict.close();
  document.removeEventListener("click", spanishdict.closeClick, true);
}
spanishdict.showDefinition = function (definition) {
  if (!spanishdict.current) return;
  spanishdict.current.definition.childNodes[1].innerHTML = definition;
}

safari.self.addEventListener("message", spanishdict.receiveMessage, false);
