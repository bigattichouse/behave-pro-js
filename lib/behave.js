var fs = require('fs')
  , commandLine = require('optimist').argv
  , zip = require("zip");


/**
 * Grab custom values from command line args. If not found use default value.
 * @param shortName -( c | m | o | p )
 * @param longName  -( config | manual | output | project )
 * @param defaultValue
 * @returns {*}
 */
function defaultedCommandLineOptions(shortName, longName, defaultValue) {
  if (commandLine[longName]) {
    return commandLine[longName]
  }
  if (commandLine[shortName]) {
    return commandLine[shortName];
  }
  return defaultValue;
}


var configFile = defaultedCommandLineOptions('c', 'config', './config.json');
fs.readFile(configFile, function (err, data) {
  if (err) throw new Error(err);
  var behaveConfig = JSON.parse(data.toString());
  behaveConfig.output = defaultedCommandLineOptions('o', 'output', './features/');
  behaveConfig.manual = defaultedCommandLineOptions('m', 'manual', 1);
  downloadFeatures(behaveConfig);
});

function findProject(JiraProject, behaveConfig) {
  var result = null;
  behaveConfig.projects.forEach(function (project) {
    if (project.jira.toUpperCase() == JiraProject.toUpperCase()) {
      result = project;
    }
  });
  return result;
}

function downloadFeatures(behaveConfig) {
  var projectSelected = defaultedCommandLineOptions('p', 'project', behaveConfig.projects[0].jira);
  var project = findProject(projectSelected, behaveConfig);
  streamFeatures(project, behaveConfig);
}

function streamFeatures(project, behaveConfig) {
  var https = require("https");
  var options = {
    path: 'https://behave.pro/rest/cucumber/1.0/project/' + project.projectID + '/features?manual=' + behaveConfig.manual,
    hostname: 'behave.pro',
    headers: {
      'Authorization': 'Basic ' + Buffer(project.userID + ":" + project.apiKey).toString('base64')
    }
  };
  var req = https.request(options, function (res) {
    //case res.statusCode);
    var buffer = new Buffer(0);
    res.on('data', function (d) {
      buffer = Buffer.concat([buffer, d]);
    });
    res.on('end', function (d) {
      processDownload(buffer, behaveConfig);
    });
    res.on('close', function (d) {
      processDownload(buffer, behaveConfig);
    });
  });

  req.on('error', function (e) {
    throw new Error(e);
  });
  req.end();
}

function featureIssue(data) {
  var result = "";
  data.split("\n").forEach(function (line) {
    var searchLine = line.trim().split(" ");
    var firstWord = ("" + searchLine[0]);
    if (/\B@{1}/.test(firstWord)) {
      result = firstWord.substr(1);
    }
  });
  return result;
}

function processDownload(buffer, behaveConfig) {
  var reader = zip.Reader(buffer);
  reader.forEach(function (entry) {
    var data = entry.getData();
    var feature = entry._header.file_name;
    data = data.toString('utf-8');
    console.log("Found feature for issue: " + featureIssue(data));
    var filename = behaveConfig.output + featureIssue(data) + "." + feature;
    fs.writeFile(filename, data, function (err) {
      if (err) {
        throw new Error(err);
      } else {
        console.log(filename + " Created.");
      }
    });
  });
}
