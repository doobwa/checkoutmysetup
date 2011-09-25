// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){


  window.Marker = Backbone.Model.extend({

    // Default attributes for a marker item.
    defaults: function() {
      return { };
    },
    urlRoot : '/markers',
    initialize: function(attributes) { 
      this.id = attributes['_id']; 
    }
  });



  // Marker Collection
  // ---------------

  // The collection of markers is backed by *localStorage* instead of a remote
  // server.
  window.MarkerList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Marker,

    // Save all of the marker items under the `"markers"` namespace.
    url : function() {
      return  'markers';
    },


  });

  // Create our global collection of **Markers**.
  window.Markers = new MarkerList;


  // Marker Item View
  // --------------

  // The DOM element for a marker item...
  window.MarkerView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "div",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "dblclick div.highlight"    : "clear",
      "keypress .marker-input"      : "updateOnEnter"
    },

    // The MarkerView listens for changes to its model, re-rendering.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the contents of the marker item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      this.setLoc();
      return this;
    },

    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the marker item.
    setText: function() {
      var text =  this.model.get('text');
      this.$('.highlight-text').text(text);
    },

    setLoc: function() {
      this.$('.highlight').css({left:this.model.get('x'),top:this.model.get('y')});
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the marker.
    close: function() {
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove this view from the DOM.
    remove: function() {
      $(this.el).remove();
    },

    // Remove the marker and the blurb, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------


  window.SubsetupView = Backbone.View.extend({
    el: $("#setupapp"),
    events: {
      "keypress #new-marker":  "createOnEnter",
      "mousedown #imgtag img": "showTmpMarker",
      "click #tmp-box": "hideTmpMarker",
      "mouseenter #imgtag" : "showMarkers",
      "mouseleave #imgtag" : "hideMarkers",
      "mouseenter .marker" : "toggleMarker",
      "mouseleave .marker" : "toggleMarker",
    },


    initialize: function() {
      this.inputmarker = this.$("#new-marker");

      Markers.bind('add',   this.addOneMarker, this);
      Markers.bind('reset', this.addAllMarker, this);
      Markers.bind('all',   this.render, this);

      Markers.fetch();
    },

    render: function() {

    },
    showTmpMarker: function(e) {
      var tagwidth = 20;
      var mouseX = 0;
      var mouseY = 0;
      var imgtag = this.$("#imgtag");
      mouseX = e.pageX - tagwidth/2 - imgtag.offset().left;
      mouseY = e.pageY - tagwidth/2 - imgtag.offset().top;
      $('#tmp-marker').removeClass("hidden");
      $('#tmp-marker').css({top:mouseY,left:mouseX});
    },
    hideTmpMarker: function() {
      $('#tmp-marker').addClass("hidden");
    },
    createOnEnter: function(e) {
      var text = this.inputmarker.val();
      if (!text || e.keyCode != 13) return;
      var tag = this.$('#tmp-marker'); // TODO: what happens if no tag??
      var m = Markers.create({text:text,x:tag.css("left"),y:tag.css("top")});
      $('#tmp-marker').addClass("hidden");
      this.inputmarker.val('');
    },
    addOneMarker: function(marker) {
      var view = new MarkerView({model: marker});
      this.$("#marker-list").append(view.render().el);
    },
    addAllMarker: function() {
      Markers.each(this.addOneMarker);
    },
    hideMarkers: function() {
      this.$("#marker-list").addClass("hidden");
      return true;
    },
    showMarkers: function() {
      this.$("#marker-list").removeClass("hidden");
      return true;
    },
    toggleMarker: function(e) {
      e.target.classList.toggle("highlight");
      var x = e.target.style.left;
      var m = Markers.at(_.indexOf(Markers.pluck("x"),x));
      return true;
    }

  });


  window.App = new SubsetupView;

});


function split(val) {
    return val.split(/@\s*/);
}

function extractLast(term) {
    return split(term).pop();
}

function getTags(term, callback) {
    $.ajax({
        url: "http://api.stackoverflow.com/1.1/tags",
        data: {
            filter: term,
            pagesize: 5
        },
        type: "POST",
        success: callback,
        jsonp: "jsonp",
        dataType: "jsonp"
    });    
}

$(document).ready(function() {

$("#new-markers")
    // don't navigate away from the field on tab when selecting an item
    .bind("keydown", function(event) {
        if (event.keyCode === $.ui.keyCode.TAB && $(this).data("autocomplete").menu.active) {

            event.preventDefault();
        }
    }).autocomplete({
        source: function(request, response) {
            if (request.term.indexOf("@") >= 0) {
                $("#loading").show();
                getTags(extractLast(request.term), function(data) {
                    response($.map(data.tags, function(el) {
                        return {
                            value: el.name,
                            count: el.count
                        }
                    }));
                    $("#loading").hide();                    
                });
            }
        },
        focus: function() {
            // prevent value inserted on focus
            return false;
        },
        select: function(event, ui) {
            var terms = split(this.value);
            // remove the current input
            terms.pop();
            // add the selected item
            terms.push(ui.item.value);
            // add placeholder to get the comma-and-space at the end
            terms.push("");
            this.value = terms.join("");
            return false;
        }
    }).data("autocomplete")._renderItem = function(ul, item) {
        return $("<li>")
            .data("item.autocomplete", item)
            .append("<a>" + item.label + "&nbsp;<span class='count'>(" + item.count + ")</span></a>")
            .appendTo(ul);
    };
});
