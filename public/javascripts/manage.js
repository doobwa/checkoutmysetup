// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Setup Model
  // ----------

  // Our basic **Setup** model has `text`, `order`, and `done` attributes.
  window.Setup = Backbone.Model.extend({
    initialize: function(attributes) { 
      this.id = attributes['_id']; 
    },

    // Default attributes for a setup item.
    defaults: function() {
      return {
        done:  false,
        order: Setups.nextOrder()
      };
    },

    // Toggle the `done` state of this setup item.
    toggle: function() {
      this.save({done: !this.get("done")});
    }

  });

  // Setup Collection
  // ---------------

  // The collection of setups is backed by *localStorage* instead of a remote
  // server.
  window.SetupList = Backbone.Collection.extend({

    // Reference to this collection's model.
    model: Setup,

    // Save all of the setup items under the `"setups"` namespace.
    url: function() {
      return 'setups';
    },
//    localStorage: new Store("setups"),

    // Filter down the list of all setup items that are finished.
    done: function() {
      return this.filter(function(setup){ return setup.get('done'); });
    },

    // Filter down the list to only setup items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Setups in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Setups are sorted by their original insertion order.
    comparator: function(setup) {
      return setup.get('order');
    }

  });

  // Create our global collection of **Setups**.
  window.Setups = new SetupList;

  // Setup Item View
  // --------------

  // The DOM element for a setup item...
  window.SetupView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#setup-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .check"             : "toggleDone",
      "click .editbtn"           : "edit",
      "click .savebtn"           : "update",
      "click .cancelbtn"           : "close",
      "click .deletebtn"         : "clear",
      "keypress .setup-input"    : "updateOnEnter"
    },

    // The SetupView listens for changes to its model, re-rendering.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the contents of the setup item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.setText();
      return this;
    },

    // To avoid XSS (not that it would be harmful in this particular app),
    // we use `jQuery.text` to set the contents of the setup item.
    setText: function() {
      var innerstuff = '<a href=\"/setups/' + this.model.get('_id') + '/edit\">' + this.model.get('title') + '</a>';
      this.$('.setup-text').html(innerstuff);
      var text = this.model.get('title');
      this.input = this.$('.setup-input');
      this.input.bind('blur', _.bind(this.close, this)).val(text);
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input fields.
    edit: function() {
      $(this.el).addClass("editing");
      this.$('.input-title')[0].value = this.model.get('title');
      this.$('.input-url')[0].value = this.model.get('url');
      this.$('.input-description')[0].value = this.model.get('description');
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the setup.
    close: function() {
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    update: function(e) {
      var title = this.$('.input-title')[0].value;
      var url = this.$('.input-url')[0].value;
      var description = this.$('.input-description')[0].value;
      this.model.save({title: title,url:url,description:description});
      this.close();
    },
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove this view from the DOM.
    remove: function() {
      $(this.el).remove();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  window.SetupAppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#setupapp"),

    // Our template for the line of statistics at the bottom of the app.
//    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      // "keypress #new-setup":  "createOnEnter",
      // "keyup #new-setup":     "showTooltip",
      "click .setup-clear a": "clearCompleted"
    },

    // At initialization we bind to the relevant events on the `Setups`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting setups that might be saved in *localStorage*.
    initialize: function() {
//      this.input    = this.$("#new-setup");

      Setups.bind('add',   this.addOne, this);
      Setups.bind('reset', this.addAll, this);
      Setups.bind('all',   this.render, this);

      Setups.fetch();
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      // this.$('#setup-stats').html(this.statsTemplate({
      //   total:      Setups.length,
      //   done:       Setups.done().length,
      //   remaining:  Setups.remaining().length
      // }));
    },

    // Add a single setup item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(setup) {
      var view = new SetupView({model: setup});
      this.$("#setup-list").append(view.render().el);
    },

    // Add all items in the **Setups** collection at once.
    addAll: function() {
      Setups.each(this.addOne);
    },

    // If you hit return in the main input field, and there is text to save,
    // create new **Setup** model persisting it to *localStorage*.
    createOnEnter: function(e) {
      var text = this.input.val();
      if (!text || e.keyCode != 13) return;
      Setups.create({text: text});
      this.input.val('');
    },

    // Clear all done setup items, destroying their models.
    clearCompleted: function() {
      _.each(Setups.done(), function(setup){ setup.destroy(); });
      return false;
    },

    // Lazily show the tooltip that tells you to press `enter` to save
    // a new setup item, after one second.
    showTooltip: function(e) {
      var tooltip = this.$(".ui-tooltip-top");
      var val = this.input.val();
      tooltip.fadeOut();
      if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
      if (val == '' || val == this.input.attr('placeholder')) return;
      var show = function(){ tooltip.show().fadeIn(); };
      this.tooltipTimeout = _.delay(show, 1000);
    }

  });

  // Finally, we kick things off by creating the **App**.
  window.SetupApp = new SetupAppView;

});
