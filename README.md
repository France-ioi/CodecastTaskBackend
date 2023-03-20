# CodecastTaskBackend

## Purpose

This project aims at providing a back-end server that will serve as a companion to
the [Codecast front-end](https://github.com/France-ioi/codecast). The main
functionalities provided by this back-end are:

- fetch information about a specific task
- grade a user submission on a task
- save user source code and avancement on a task

It is a complete rewriting in NodeJS/TypeScript of [TaskPlatform](https://github.com/France-ioi/TaskPlatform)
which has been written in PHP in 2015.

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

## Project status

This project is currently in development and not used in production yet.

## Development

You need to have NodeJS and Yarn installed on your computer. Then, clone this
project and use:

```
yarn
yarn dev
```

### Building

To build a new version of the back-end, use:

```
yarn build
```
