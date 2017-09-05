const {makeExecutableSchema} = require('graphql-tools');
const resolvers = require('./resolvers');

const typeDefs = `
   type Job {
       _id: ID!,
       name: String!,
       createdAt: Int!,
       git: Git!
   }
     
   type Query {
       allJobs: [Job!]!
   }
   
   input GitInput {
       id: String!
       name: String!
       fullName: String!
   }
   
   type Git {
       id: String!
       name: String!
       fullName: String!
   }
   
   type Mutation {
       createJob(name: String!, git: GitInput!, cdFilePath: String): Job!
   }
`;

module.exports = makeExecutableSchema({typeDefs, resolvers});