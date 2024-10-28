import {Server} from '@hapi/hapi';
import {
  getGitRepositoryBranches,
  getGitRepositoryFolderContent,
  gitRepositoryBranchesDecoder,
  gitRepositoryFolderContentDecoder
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
}
