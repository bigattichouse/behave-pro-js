#Behave Pro Node.js exporter

![Behave Pro](http://hindsightsoftware.com/img/solutions/behave-pro/banner.png)

Export Gherkin features from Behave Pro through a simple CLI app.

## Configuration
```
{
"host":"http://example.com",
"projects":[
        {
            "projectID": "[project id from jira/behave pro]",
            "userID": "[user id from jira/behave pro]",
            "apiKey": "[api key from jira/behave pro]",
            "jira": "[associated jira project]"
        }
    ]
}
```
##Usage:
```
$ behavepro [-c | --config ./config.json] [-m | --manual true] [-o | --output ./features/] [-p | --project projectId]
```

Special thanks to [@bigattichouse](https://twitter.com/bigattichouse)!