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

var esHostUrl = 'https://admin:lasi2016@a32df3a1a322b02cdb3d411289e033c4.us-east-1.aws.found.io:9243';
var maxLocationsPerUser = 4;
var maxVerbsPerUser = 7;

/**
 * Require packages
 */

var _ = require('lodash');
var winston = require('winston');
var elasticsearch = require('elasticsearch');

/**
 * Set up sets of values to randomly select from
 */

winston.info('Starting generation of random users, locations, verbs and objects');

// xAPI verbs copied from:
// https://github.com/adlnet/xAPIVerbs/blob/master/verbs.js

var xAPIVerbs = {
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
  "invited" : {
     "id" : "https://vozniuk.com/xapi/adl/verbs/invited",
     "display" : {"en-US" : "invited"}
  }
};

// Generate an array of users

// Build an array of realistic locations and IPs

// Assign to each user 2-3 locations (with IPs) she would typically interact from

// Generate an array of objects (maybe using existing items as a basis)

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


var actionJson = {
    timestamp: new Date(),
    actor: {
      name: 'Sally Glider',
      mbox: 'mailto:sally@example.com'
    },
    verb: {
      id: 'http://adlnet.gov/expapi/verbs/experienced',
      display: {
        'en-US': 'experienced'
      }
    },
    object: {
      id: 'http://example.com/activities/solo-hang-gliding',
      definition: {
        name: {
          'en-US': 'Solo Hang Gliding'
        }
      }
    },
    context: {
      ipAddress: '127.0.0.1',
      location: {
        lon: 6.6666700,
        lat: 46.533330
      },
      city: 'Lausanne',
      countryCode: 'CH',
      countryName: 'Switzerland'
    }
  }

/**
 * Establish an Elasticsearch connection
 */

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
    winston.error('Elasticsearch connection cannot be established. ' + err);
  }

  winston.info('Elasticsearch connection to ' + esHostUrl +
    ' was established successfully');

    winston.info('Putting object into Elasticsearch: ', JSON.stringify(actionJson));

  // while (true) {
    // TODO: call function to generate mock data

    esClient.create({
      index: 'actions',
      type: 'action',
      body: actionJson
    }).then(function (resp) {
      winston.info('Object was successfully put into Elasticsearch with response: ', resp);
    }, function (err) {
      winston.error('An error occurred when creating an action in Elasticsearch: ', err);
    });

    // TODO: wait a bit before the next request
  // }
});
