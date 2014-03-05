var commandLine = require('optimist').argv;
var fs = require('fs');


function defaultedCommandLineOptions(shortName,longName,defaultValue){
    if(commandLine[longName]){
        return commandLine[longName]
    }
    if(commandLine[shortName]){
        return commandLine[shortName];
    }
    return defaultValue;
}


configFile = defaultedCommandLineOptions('c','config','./config.json');
fs.exists(configFile, function (exists) {
    if(!exists){
        console.log('No config.json file, or file not found');
        process.exit(1);
    } else 
        fs.readFile(configFile, function (err, data) {
            behaveConfig = JSON.parse(data.toString());
            behaveConfig = loadCommandLineArgs(behaveConfig);
            downloadFeatures(behaveConfig);
        });
});

function loadCommandLineArgs(behaveConfig){
    behaveConfig.output = defaultedCommandLineOptions('o','output','./features/');
    behaveConfig.manual = defaultedCommandLineOptions('m','manual',1);
    return behaveConfig;
}

function findProject(JiraProject,behaveConfig){
    var result = null;
    behaveConfig.projects.forEach(function(project){
        if(project.jira.toUpperCase()==JiraProject.toUpperCase()){
            result = project;
        }
    });
    return result;
}

function downloadFeatures(behaveConfig){
    projectSelected = defaultedCommandLineOptions('p','project',behaveConfig.projects[0].jira);
    var project = findProject(projectSelected,behaveConfig);
    get(project,behaveConfig);
}

function get(project,behaveConfig){
    var https = require("https");
    var options= {path: 'https://behave.pro/rest/cucumber/1.0/project/' + project.projectID + '/features?manual='+behaveConfig.manual,
                  hostname:'behave.pro',
                  headers: {
                    'Authorization': 'Basic ' + Buffer(project.userID+":"+project.apiKey).toString('base64')
                    }
                  };
    var req = https.request(options, function(res) {        //case res.statusCode); 
        var buffer = new Buffer(0);
        res.on('data', function(d) {
            buffer = Buffer.concat([buffer,d]);
        });
        res.on('end', function(d) {
            processDownload(buffer,project,behaveConfig);
        });
        res.on('close', function(d) {
            processDownload(buffer,project,behaveConfig);
        });
    });

    req.on('error', function(e) {
        console.error(e);
    });
    req.end();
}

function featureIssue(data){    var result = "";    data.split("\n").forEach(function(line){        var searchLine = line.trim().split(" ");
        var firstWord = (""+searchLine[0]);        if(firstWord.substr(0,1)==="@"){            result = firstWord.substr(1);        }    });
    return result;}

function processDownload(buffer,project,behaveConfig){
    var zip = require("zip");
    var reader = zip.Reader(buffer);
    reader.forEach(function (entry) {        var data = entry.getData();
        var feature = entry._header.file_name;
        data = data.toString('utf-8');
        console.log("Found feature for issue: "+featureIssue(data));
        fs.writeFile(behaveConfig.output+featureIssue(data)+"."+feature, data, function(err) {
            if(err) {
                console.log(err);
            } else {
                console.log(behaveConfig.output+featureIssue(data)+"."+feature+" Created.");
            }
});     });}
