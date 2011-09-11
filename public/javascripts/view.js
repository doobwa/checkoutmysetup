$(function(){

  window.Marker = Backbone.Model.extend({
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
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      this.setLoc();
      return this;
    },
    setText: function() {
      var text =  this.model.get('text');
      this.$('.highlight-text').text(text);
    },
    setLoc: function() {
      this.$('.highlight').css({left:this.model.get('x'),top:this.model.get('y')});
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
(function(d){
        var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
        js = d.createElement('script'); js.id = id; js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js#appId=154879431267113&xfbml=1";
        d.getElementsByTagName('head')[0].appendChild(js);
      }(document));
