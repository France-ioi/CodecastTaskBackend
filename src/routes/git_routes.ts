import {Server} from '@hapi/hapi';
import {
  getGitRepositoryBranches,
  getGitRepositoryFolderContent,
  gitPull,
  gitPullDecoder, gitPush, gitPushDecoder,
  gitRepositoryBranchesDecoder,
  gitRepositoryFolderContentDecoder, NotUpToDateError
} from '../git_sync';
import {decode} from '../util';
import {NotFoundError} from '../error_handler';

export function addGitRoutes(server: Server): void {
  server.route({
    method: 'GET',
    path: '/git/repository-branches',
    options: {
      handler: async (request, h) => {
        const parameters = decode(gitRepositoryBranchesDecoder)(request.query);

        try {
          const branches = await getGitRepositoryBranches(parameters.repository);

          return h.response({
            success: true,
            branches,
          });
        } catch (e) {
          throw new NotFoundError('Unable to fetch repository branches, check that you can access this repository');
        }
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/git/repository-folder-content',
    options: {
      handler: async (request, h) => {
        const parameters = decode(gitRepositoryFolderContentDecoder)(request.query);

        try {
          const content = await getGitRepositoryFolderContent(parameters.repository, parameters.branch, parameters.folder);

          return h.response({
            success: true,
            content,
          });
        } catch (e) {
          throw new NotFoundError('Unable to fetch repository content, check that you can access this repository');
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/git/pull',
    options: {
      handler: async (request, h) => {
        const parameters = decode(gitPullDecoder)(request.payload);

        try {
          const pullResult = await gitPull(parameters.repository, parameters.branch, parameters.file, parameters.revision, parameters.source);

          return h.response({
            success: true,
            content: pullResult.content,
            revision: pullResult.revision,
          });
        } catch (e) {
          throw new NotFoundError('Unable to fetch repository content, check that you can access this repository');
        }
      }
    }
  });

  server.route({
    method: 'POST',
    path: '/git/push',
    options: {
      handler: async (request, h) => {
        const parameters = decode(gitPushDecoder)(request.payload);

        try {
          const pushResult = await gitPush(parameters);

          return h.response({
            success: true,
            revision: pushResult.revision,
          });
        } catch (e) {
          if (e instanceof NotUpToDateError) {
            return h.response({
              success: false,
              error: 'not_up_to_date',
            }).code(400);
          }

          throw new NotFoundError('Unable to fetch repository content, check that you can access this repository');
        }
      }
    }
  });
}
