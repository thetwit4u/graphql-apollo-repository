const fs = require('fs');
const { printSchema } = require('graphql');
const schema = require('.');

fs.writeFileSync('./schema/schema.graphql', printSchema(schema));