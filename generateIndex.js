var fs = require('fs');
var async = require("async");

var indexContents = {};

function index(folder) {
  fs.readdir(folder, function(err, items) {
    items = items.filter(function(v) {
      return (v[0] !== "_");
    });

    var files = items.filter(function(v) {
      return (v.match(".json") &&  fs.statSync(folder + v).isFile());
    }).map(function(v) {
      return folder + v;
    });

    var dirs = items.filter(function(v) {
      return fs.statSync(folder + v).isDirectory();
    }).map(function(v) {
      return folder + v;
    });

    async.each(dirs, function(v, cb) {
      cb(index(v + "/"));
    }, function(err) {
      if (err) throw err;
    });

    async.each(files, function(v, cb) {
      var keys = v.replace(root, "").replace(".json", "");
      keys = keys.split('/');
      var value = JSON.parse(fs.readFileSync(v, "utf8"));

      if(keys.length > 1) {
        parentNode = indexContents;

        keys.forEach(function(key, index) {
          if(index === keys.length - 1) {
            parentNode[key] = value[keys[index]];
          } else {
            parentNode[key] = parentNode[key] || {};
            parentNode = parentNode[key];
          }
        });
      } else {
        indexContents[keys[0]] = value[keys[0]];
      }

      cb();
    }, function(err) {
      if (err) throw err;

      var ordered = {};

      Object.keys(indexContents).sort().forEach(function(key) {
        ordered[key] = indexContents[key];
      });

      indexContents = ordered;

      fs.writeFileSync(root + "/_index.json", JSON.stringify(indexContents, null, 4));

      fs.readdir(root, function(err, files) {
        async.each(files, function(file, cb) {
          if(fs.statSync(root + "/" + file).isDirectory()) {
            var content = indexContents[file] || {};
            content = JSON.stringify(content, null, 4);

            fs.writeFileSync(root + "/" + file + "/_index.json", content);
          }
        }, function(err) {
          if (err) throw err;
        });
      });
    });
  });
}

var root = __dirname;

root += "/data.json/";
fs.writeFile(root + "/_index.json", "", function(err) {
  if (err) throw err;
  index(root);
});
