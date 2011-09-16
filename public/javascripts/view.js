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
  window.MarkerList = Backbone.Collection.extend({
    model: Marker,
    url : function() {
      return  'markers';
    },
  });

  window.Markers = new MarkerList;

  window.MarkerView = Backbone.View.extend({
    tagName:  "div",
    template: _.template($('#item-template').html()),
    events: {  },
    initialize: function() {
      this.model.bind('change', this.render, this);
    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      var text =  this.model.get('text');
      this.$('.highlight-text').text(text);
      this.$('.highlight').css({left:this.model.get('x'),
                                top:this.model.get('y')});
      return this;
    }
  });


  window.SubsetupView = Backbone.View.extend({
    el: $("#setupapp"),
    events: {
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

(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js#appId=151614408263382&xfbml=1";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

