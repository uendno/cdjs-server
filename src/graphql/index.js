const {makeExecutableSchema} = require('graphql-tools');
const resolvers = require('./resolvers/index');

const typeDefs = `
   type Job {
       _id: ID!,
       name: String!,
       createdAt: Int!,
       git: Git!
   }
   
   type Git {
       _id: ID!
       username: String!
       avatarUrl: String
   }
   
   type ReposRes {
       numberOfPages: Int!,
       repos: [Repo!]!
   }
   
   type Repo {
       id: Int!
       name: String!
       fullName: String!
       private: Boolean!
       url: String!
       ownerAvatarUrl: String
   }
   
   type Query {
       allJobs: [Job!]!
       allGithubAccounts: [Git!]!
       reposForAccountId(accountId: String!, page: Int): ReposRes!
       jobByName(name: String!): Job
       branchesForRepo(accountId: String!, repoFullName: String!): [String!]!
   }

   type Mutation {
       createJob(name: String!, gitAccountId: String!, repoFullName: String!, branch: String!, cdFilePath: String, ): Job!
   }
`;

module.exports = makeExecutableSchema({typeDefs, resolvers});