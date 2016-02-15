Vue.config.debug = true;
Vue.filter('json', function(object) {
  return JSON.stringify(object, null, 4);
});

Vue.filter('breadcrumbs', function(array) {

});

Vue.filter('process', function(string) {
  return string.replace(".json", "").replace("_", " ");
})

function filterData(data, self) {
  self.parents = {};
  self.darwins = {};

  Object.keys(data).forEach(function(v) {
    if(Array.isArray(data[v])) {
      self.darwins[v] = data[v].join(', ');
    } else if(typeof data[v] === "object") {
      self.parents[v] = data[v];
    } else {
      self.darwins[v] = data[v];
    }
  });
}

var app = new Vue({
  el: '#app',
  data: {
    content: {},
    cache: {},
    parents: {},
    darwins: {},
    nodeStack: ["home"],
    hidden: true
  },
  computed: {
    parentsExists: function() {
      return Object.keys(this.parents).length > 0;
    },
    darwinsExists: function() {
      return Object.keys(this.darwins).length > 0;
    },
    url: function() {
      if (this.type) {
        return "/data/" + this.type + "/_index.json";
      } else {
        return "/data/_index.json";
      }
    },
    breadcrumbs: function() {
      var breadcrumbs = this.nodeStack.map(function(v, i) {
        return "<li><a class='uppercase' @click='setBCPos(" + i + ")' >" + v + "</a></li>";
      });

      return breadcrumbs.join("\n");
    }
  },
  watch: {
    'breadcrumbs': function() {
      this.$compile($(".breadcrumb")[0]);
    }
  },
  methods: {
    toggleState: function() {
      this.hidden = !this.hidden;
    },
    setBCPos: function(index) {
      this.nodeStack = this.nodeStack.splice(0, index + 1);
      this.content = this.cache;

      for(var i = 1; i < this.nodeStack.length; i++) {
        this.content = this.content[this.nodeStack[i]];
      }

      filterData(this.content, this);
    },
    setType: function(type) {
      this.nodeStack.push(type);
      this.content = this.content[type];

      filterData(this.content, this);
    }
  },
  ready: function() {
    var self = this;
    this.$http({
      url: this.url,
      method: "GET"
    }).then(function(response) {
      this.cache = response.data;
      this.content = response.data;

      filterData(this.content, this);

      this.$compile($(".breadcrumb")[0]);
    }).then(function(err) {
      throw err;
    });
  }
});
