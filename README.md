# CodecastTaskBackend

## Purpose

This project aims at providing a back-end server that will serve as a companion to
the [Codecast front-end](https://github.com/France-ioi/codecast). The main
functionalities provided by this back-end are:

- fetch information about a specific task
- grade a user submission on a task
- save user source code and avancement on a task

It is a complete rewriting in NodeJS/TypeScript of [TaskPlatform](https://github.com/France-ioi/TaskPlatform)
which had been written in PHP in 2015.

## Interactions

The Codecast front-end can interact with this backend through a JSON API with
GET or POST methods (see the available routes in `src/server.ts`).

This back-end can then interact with other back-end servers. In particular,
to grade a user submission, this back-end calls the API of the 
[grader queue](https://github.com/France-ioi/graderqueue)
to run tests on the user submission.

This back-end also interacts with a MySQL database that will store:
- the available tasks that can be solved with Codecast
- the user submissions and the grading of each of the submissions
- the user source codes

The goal is for this database to keep the same structure as the one used by
TaskPlatform so that the migration from TaskPlatform to CodecastTaskBackend
can be done smoothly.

## Development

You need to have NodeJS and Yarn installed on your computer.
First, clone this project.
Then copy `.env` file to a `.env.local` file and fill in your database credentials.
Then use:

```
yarn
yarn dev
```

### Interaction with Algorea Platform

Generate a pair of public/private keys

```
openssl genrsa -out keys/platform_key.pem 2048
openssl rsa -in keys/platform_key.pem -outform PEM -pubout -out keys/platform_public.pem
```

And put them in your `.env.local` file:
- the `platform_key.pem` in a variable `PLATFORM_OWN_PRIVATE_KEY`
- the `platform_public.pem` in a variable `PLATFORM_OWN_PUBLIC_KEY`

And give your public key to an Algorea platform admin.

### Git synchronization

Generate a SSH key

```
ssh-keygen -t ed25519 -f keys/git_sync -N ""
```

This key will be used to connect to Git repositories to establish
the synchronization.
The public key can be added to the deploy keys of the concerned
Git repositories.

### Testing

To run the Cucumber tests, prepare the testing environment: 
1. Create a database `task_platform_test`
2. Import `schema.sql` into this database
3. Copy `.env` to a `.env.test` file and fill in your database credentials

Then, run:

```
yarn test
```

### Building

To build a new version of the back-end, use:

```
yarn build
```

