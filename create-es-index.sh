#!/bin/bash

echo "Starting to initialise the Elasticsearch actions index and the action mapping"
echo "TODO"


# *** Create index

PUT actions
{
}

# *** Create item mapping

PUT actions/action/_mapping
{
   "action": {
      "properties": {
         "timestamp": {
            "type": "date",
            "format": "dateOptionalTime"
         },
         "actor": {
            "properties": {
               "id": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "name": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "mbox": {
                  "type": "string"
               }
            }
         },
         "verb": {
            "properties": {
               "id": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "display": {
                  "properties": {

                  }
               }
            }
         },
         "object": {
            "properties": {
               "id": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "name": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "objectType": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "definition": {
                  "properties": {
                     "name": {
                        "properties" : {
                           "en-US": {
                              "type": "string",
                              "index": "not_analyzed"
                           }
                        }
                     }
                  }
               }
            }
         },
         "context": {
            "properties": {
               "city": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "countryCode": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "countryName": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "ipAddress": {
                  "type": "string",
                  "index": "not_analyzed"
               },
               "location": {
                  "type": "geo_point"
               }
            }
         }
      }
   }
}
