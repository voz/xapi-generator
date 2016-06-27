/**
 * This script aims to generate a stream of actions in the xAPI or ActivityStreams formats
 * and feed it to Elasticsearch for Kibana visualisation.
 *
 * This script is used on the LASI 2016 workshop in Bilbao to demonstrate basics of
 * interactive data analysis with Elasticsearch and Kibana
 *
 * Created by Andrii Vozniuk on 24.06.2016
 * Andrii@Vozniuk.com
 *
 * MIT License
 */

'use strict'

/**
 * Set up key parameters
 */

var esHostUrl = 'https://admin:lasi2016@3531ac3758f84d04f963908ae3840f5c.us-east-1.aws.found.io:9243';
var usersCount = 200;
var objectsCount = 500;
var locationsCount = 20;

var locationsPerUser = 4;
var verbsPerUser = 7;
var objectsPerUser = 7;
var usersPerUser = 5;

var maxWaitBetweenActions = 1000;

/**
 * Require packages
 */

var _ = require('lodash');
var winston = require('winston');
var elasticsearch = require('elasticsearch');
var Chance = require('chance');
var chance = new Chance();

/**
 * Set up sets of values to randomly select from
 */

winston.info('Starting generation of random users, locations, verbs and objects');

// xAPI verbs copied from:
// https://github.com/adlnet/xAPIVerbs/blob/master/verbs.js
var xAPIVerbsObj = {
  "abandoned" : {
     "id" : "https://w3id.org/xapi/adl/verbs/abandoned",
     "display" : {"en-US" : "abandoned",
                  "fr-FR" : "a abandonné"}
  },
  "answered" : {
     "id" : "http://adlnet.gov/expapi/verbs/answered",
     "display" : {"de-DE" : "beantwortete",
                  "en-US" : "answered",
                  "fr-FR" : "a répondu",
                  "es-ES" : "contestó"}
  },
  "asked" : {
     "id" : "http://adlnet.gov/expapi/verbs/asked",
     "display" : {"de-DE" : "fragte",
                  "en-US" : "asked",
                  "fr-FR" : "a demandé",
                  "es-ES" : "preguntó"}
  },
  "attempted" : {
     "id" : "http://adlnet.gov/expapi/verbs/attempted",
     "display" : {"de-DE" : "versuchte",
                  "en-US" : "attempted",
                  "fr-FR" : "a essayé",
                  "es-ES" : "intentó"}
  },
  "attended" : {
     "id" : "http://adlnet.gov/expapi/verbs/attended",
     "display" : {"de-DE" : "nahm teil an",
                  "en-US" : "attended",
                  "fr-FR" : "a suivi",
                  "es-ES" : "asistió"}
  },
  "commented" : {
     "id" : "http://adlnet.gov/expapi/verbs/commented",
     "display" : {"de-DE" : "kommentierte",
                  "en-US" : "commented",
                  "fr-FR" : "a commenté",
                  "es-ES" : "comentó"}
  },
  "completed" : {
     "id" : "http://adlnet.gov/expapi/verbs/completed",
     "display" : {"de-DE" : "beendete",
                  "en-US" : "completed",
                  "fr-FR" : "a terminé",
                  "es-ES" : "completó"}
  },
  "exited" : {
     "id" : "http://adlnet.gov/expapi/verbs/exited",
     "display" : {"de-DE" : "verließ",
                  "en-US" : "exited",
                  "fr-FR" : "a quitté",
                  "es-ES" : "salió"}
  },
  "experienced" : {
     "id" : "http://adlnet.gov/expapi/verbs/experienced",
     "display" : {"de-DE" : "erlebte",
                  "en-US" : "experienced",
                  "fr-FR" : "a éprouvé",
                  "es-ES" : "experimentó"}
  },
  "failed" : {
     "id" : "http://adlnet.gov/expapi/verbs/failed",
     "display" : {"de-DE" : "verfehlte",
                  "en-US" : "failed",
                  "fr-FR" : "a échoué",
                  "es-ES" : "fracasó"}
  },
  "imported" : {
     "id" : "http://adlnet.gov/expapi/verbs/imported",
     "display" : {"de-DE" : "importierte",
                  "en-US" : "imported",
                  "fr-FR" : "a importé",
                  "es-ES" : "importó"}
  },
  "initialized" : {
     "id" : "http://adlnet.gov/expapi/verbs/initialized",
     "display" : {"de-DE" : "initialisierte",
                  "en-US" : "initialized",
                  "fr-FR" : "a initialisé",
                  "es-ES" : "inicializó"}
  },
  "interacted" : {
     "id" : "http://adlnet.gov/expapi/verbs/interacted",
     "display" : {"de-DE" : "interagierte",
                  "en-US" : "interacted",
                  "fr-FR" : "a interagi",
                  "es-ES" : "interactuó"}
  },
  "launched" : {
     "id" : "http://adlnet.gov/expapi/verbs/launched",
     "display" : {"de-DE" : "startete",
                  "en-US" : "launched",
                  "fr-FR" : "a lancé",
                  "es-ES" : "lanzó"}
  },
  "mastered" : {
     "id" : "http://adlnet.gov/expapi/verbs/mastered",
     "display" : {"de-DE" : "meisterte",
                  "en-US" : "mastered",
                  "fr-FR" : "a maîtrisé",
                  "es-ES" : "dominó"}
  },
  "passed" : {
     "id" : "http://adlnet.gov/expapi/verbs/passed",
     "display" : {"de-DE" : "bestand",
                  "en-US" : "passed",
                  "fr-FR" : "a réussi",
                  "es-ES" : "aprobó"}
  },
  "preferred" : {
     "id" : "http://adlnet.gov/expapi/verbs/preferred",
     "display" : {"de-DE" : "bevorzugte",
                  "en-US" : "preferred",
                  "fr-FR" : "a préféré",
                  "es-ES" : "prefirió"}
  },
  "progressed" : {
     "id" : "http://adlnet.gov/expapi/verbs/progressed",
     "display" : {"de-DE" : "machte Fortschritt mit",
                  "en-US" : "progressed",
                  "fr-FR" : "a progressé",
                  "es-ES" : "progresó"}
  },
  "registered" : {
     "id" : "http://adlnet.gov/expapi/verbs/registered",
     "display" : {"de-DE" : "registrierte",
                  "en-US" : "registered",
                  "fr-FR" : "a enregistré",
                  "es-ES" : "registró"}
  },
  "responded" : {
     "id" : "http://adlnet.gov/expapi/verbs/responded",
     "display" : {"de-DE" : "reagierte",
                  "en-US" : "responded",
                  "fr-FR" : "a répondu",
                  "es-ES" : "respondió"}
  },
  "resumed" : {
     "id" : "http://adlnet.gov/expapi/verbs/resumed",
     "display" : {"de-DE" : "setzte fort",
                  "en-US" : "resumed",
                  "fr-FR" : "a repris",
                  "es-ES" : "continuó"}
  },
  "satisfied" : {
     "id" : "https://w3id.org/xapi/adl/verbs/satisfied",
     "display" : {"en-US" : "satisfied"}
  },
  "scored" : {
     "id" : "http://adlnet.gov/expapi/verbs/scored",
     "display" : {"de-DE" : "erreichte",
                  "en-US" : "scored",
                  "fr-FR" : "a marqué",
                  "es-ES" : "anotó"}
  },
  "shared" : {
     "id" : "http://adlnet.gov/expapi/verbs/shared",
     "display" : {"de-DE" : "teilte",
                  "en-US" : "shared",
                  "fr-FR" : "a partagé",
                  "es-ES" : "compartió"}
  },
  "suspended" : {
     "id" : "http://adlnet.gov/expapi/verbs/suspended",
     "display" : {"de-DE" : "pausierte",
                  "en-US" : "suspended",
                  "fr-FR" : "a suspendu",
                  "es-ES" : "aplazó"}
  },
  "terminated" : {
     "id" : "http://adlnet.gov/expapi/verbs/terminated",
     "display" : {"de-DE" : "beendete",
                  "en-US" : "terminated",
                  "fr-FR" : "a terminé",
                  "es-ES" : "terminó"}
  },
  "voided" : {
     "id" : "http://adlnet.gov/expapi/verbs/voided",
     "display" : {"de-DE" : "entwertete",
                  "en-US" : "voided",
                  "fr-FR" : "a annulé",
                  "es-ES" : "anuló"}
  },
  "waived" : {
     "id" : "https://w3id.org/xapi/adl/verbs/waived",
     "display" : {"en-US" : "waived"}
  },
  // Two verbs made up by me to demonstrate user-user interaction analysis
  "messaged" : {
     "id" : "https://vozniuk.com/xapi/adl/verbs/messaged",
     "display" : {"en-US" : "messaged"}
  },
  // "invited" : {
  //    "id" : "https://vozniuk.com/xapi/adl/verbs/invited",
  //    "display" : {"en-US" : "invited"}
  // },
  "mentioned" : {
     "id" : "https://vozniuk.com/xapi/adl/verbs/mentioned",
     "display" : {"en-US" : "mentioned"}
  }
};

var xAPIVerbsArray = _.keys(xAPIVerbsObj); // we need an array for predefined order

// Build an array of realistic locations and IPs
var locations = [];

for (var i = 0; i < locationsCount; i++) {
  var newLocation = {
    ipAddress : chance.ip(),
    location : {
      lon: chance.longitude(),
      lat: chance.latitude()
    },
    city : chance.city(),
    countryCode : chance.country(),
    countryName : chance.country({ full: true })
  }

  locations.push(newLocation);
}


// Generate an array of objects (maybe using existing items as a basis)
var objects = [];

for (var i = 0; i < objectsCount; i++) {
  var newObj = {
      id: chance.hash(),
      definition: {
        name: {
          'en-US': chance.file()
        },
        description: {
          'en-US': chance.paragraph()
        }
      },
      objectType: "Media"
    }

  objects.push(newObj);
}

// Generate an array of users
var users = [];

for (var i = 0; i < usersCount; i++) {
  var newUser = {
    id: chance.hash(),
    name: chance.name(),
    mbox: chance.email(),
    locations: [],
    verbs: [],
    objects: [],
    users: []
  }

  // We skew the random distributions below by doing Math.pow()
  // to make the data more "interesting" for exploration

  // Assign to each user locations (with IPs) she would typically interact from
  for (var j = 0; j < locationsPerUser; j++) {
    var rndLocationNmb = Math.floor(Math.pow(Math.random(), 2)*locations.length);

    newUser.locations.push(rndLocationNmb);
  }

  // Assign to each user types of interaction she would typically do
  for (var j = 0; j < verbsPerUser; j++) {
    var rndVerbNmb = Math.floor(Math.pow(Math.random(), 2)*xAPIVerbsArray.length);
    newUser.verbs.push(rndVerbNmb);
  }

  // Assign to each user objects she would typically interact with
  for (var j = 0; j < objectsPerUser; j++) {
    var rndObjNmb = Math.floor((1-Math.pow(Math.random(), 2))*objects.length);
    newUser.objects.push(rndObjNmb);
  }

  // Assign to each user other users she interacts with
  for (var j = 0; j < usersPerUser; j++) {
    var rndObjNmb = Math.floor((1-Math.pow(Math.random(), 2))*users.length);
    newUser.users.push(rndObjNmb);
  }

  users.push(newUser);
}

// At this point we have users, verbs, objects and locations for the context

/**
 * Randomly generate event
 */

// A sample xAPI statement
// {
//     "actor": {
//         "mbox": "mailto:learner@example.com",
//         "name": "Example Learner",
//         "objectType": "Agent"
//     },
//     "verb": {
//         "id": "http://adlnet.gov/expapi/verbs/answered",
//         "display": {
//             "en-US": "answered"
//         }
//     },
//     "object": {
//         "id": "http://adlnet.gov/expapi/activities/example",
//         "definition": {
//             "name": {
//                 "en-US": "Example Activity"
//             },
//             "description": {
//                 "en-US": "Example activity description"
//             }
//         },
//         "objectType": "Activity"
//     }
// }

var getGeneratedAction = function () {
  // Pick a random user
  var userNmb = Math.floor(Math.pow(Math.random(), 2)*users.length);
  var curActorObj = users[userNmb];

  // Pick a random verb of user verbs
  var verbNmb = Math.floor(Math.pow(Math.random(), 2)*curActorObj.verbs.length);
  var curVerb = xAPIVerbsArray[curActorObj.verbs[verbNmb]];
  var curVerbObj = xAPIVerbsObj[curVerb];

  // Pick a random object or user objects
  if (curVerb === 'messaged' || curVerb === 'mentioned') {
    var objNmb = Math.floor(Math.pow(Math.random(), 2)*curActorObj.users.length);
    var curUserObj = users[curActorObj.users[objNmb]]
    var curObject = {
      id: curUserObj.id,
      name: curUserObj.name,
      objectType: 'User'
    };
  } else {
    var objNmb = Math.floor(Math.pow(Math.random(), 2)*curActorObj.objects.length);
    var curObject = objects[curActorObj.objects[objNmb]];
  }

  // Pick a random context (ip location etc)
  var locNmb = Math.floor(Math.pow(Math.random(), 2)*curActorObj.locations.length);
  var curContext = locations[curActorObj.locations[locNmb]];

  var actionJson = {
      timestamp: new Date(),
      actor: {
        id: curActorObj.id,
        name: curActorObj.name,
        mbox: curActorObj.mbox
      },
      verb: curVerbObj,
      object: curObject,
      context: curContext
    }

  return actionJson;
}

/**
 * Establish an Elasticsearch connection
 */
var generateAndSendActions = function () {
  var actionJson = getGeneratedAction();
  winston.info('Putting object into Elasticsearch: ', JSON.stringify(actionJson));

  esClient.create({
    index: 'actions',
    type: 'action',
    body: actionJson
  }).then(function (resp) {
    winston.info('Object was successfully put into Elasticsearch with response: ', resp);

    // schedule the next action
    setTimeout(generateAndSendActions, Math.random()*maxWaitBetweenActions);
  }, function (err) {
    return winston.error('An error occurred when creating an action in Elasticsearch: ', err);
  });
}

var esClient = new elasticsearch.Client({
      host: esHostUrl
    });

// TODO: Use async series for the steps

// ping the client to see if it is up
esClient.ping({
  requestTimeout: 10000,
  // undocumented params are appended to the query string
  hello: 'elasticsearch!'
}, function (err) {
  if (err) {
    return winston.error('Elasticsearch connection cannot be established. ' + err);
  }

  winston.info('Elasticsearch connection to ' + esHostUrl +
    ' was established successfully');

  generateAndSendActions();
});
