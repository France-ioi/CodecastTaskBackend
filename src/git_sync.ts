import {pipe} from "fp-ts/function";
import * as D from "io-ts/Decoder";
import {simpleGit, SimpleGit, SimpleGitOptions} from 'simple-git';
import * as fs from 'fs';
import {CachePool} from "./caching";

export const gitRepositoryBranchesDecoder = pipe(
  D.struct({
    repository: D.string,
  }),
);

export const gitRepositoryFolderContentDecoder = pipe(
  D.struct({
    repository: D.string,
    branch: D.string,
  }),
  D.intersect(D.partial({
    folder: D.string,
  })),
);

export const gitPullDecoder = pipe(
  D.struct({
    repository: D.string,
    branch: D.string,
    file: D.string,
  }),
  D.intersect(D.partial({
    source: D.string,
  })),
);

const gitSyncCachePool = new CachePool();

export async function getGitRepositoryBranches(repository: string) {
  const git = await initGitRepository(repository);

  const listRemotesRaw = await git.listRemote(['--heads']);

  return listRemotesRaw.split("\n").map(e => {
    return e.split('/heads/')[1];
  }).filter(a => undefined !== a);
}

export async function getGitRepositoryFolderContent(repository: string, branch: string, folder?: string) {
  const git = await initGitRepository(repository);

  await gitSyncCachePool.get(`fetch:${repository}:${branch}`, 60, async () => {
    await git.fetch('origin', branch);
  });

  await git.checkout(branch);

  const repoPath = getGitRepositoryPath(repository);

  const elementsList: {name: string, directory: boolean}[] = [];
  fs.readdirSync(repoPath + (folder ? '/' + folder : ''), {withFileTypes: true}).forEach(element => {
    if ('.git' === element.name) {
      return;
    }

    elementsList.push({
      name: element.name,
      directory: element.isDirectory(),
    })
  });

  elementsList.sort((a, b) => {
    if (a.directory === b.directory) {
      return a < b ? -1 : 1;
    }
    if (a.directory && !b.directory) {
      return -1;
    }

    return 1;
  });

  return elementsList;
}

async function initGitRepository(repository: string): Promise<SimpleGit> {
  const repoPath = getGitRepositoryPath(repository);

  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
  };

  const doesFolderExist = fs.existsSync(repoPath + '/.git');
  if (!doesFolderExist) {
    fs.mkdirSync(repoPath, {recursive: true});
  }

  const git: SimpleGit = simpleGit(options);

  if (!doesFolderExist) {
    await git.init();
    await git.addRemote('origin', repository);
  }

  return git;
}

function getGitRepositoryPath(repository: string) {
  return process.cwd() + '/cache/' + repository;
}

export async function gitPull(repository: string, branch: string, file: string, source?: string) {
  const git = await initGitRepository(repository);

  await gitSyncCachePool.get(`fetch:${repository}:${branch}`, 60, async () => {
    await git.fetch('origin', branch);
  });

  await git.checkout(branch, ['-f']);

  await git.pull('origin', branch, ['--rebase']);

  const repoPath = getGitRepositoryPath(repository);
  const filePath = repoPath + '/' + file;

  if (!fs.existsSync(filePath)) {
    throw new TypeError(`This file does not exist on the repository: ${file}`);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const currentRevision = await git.revparse(['HEAD']);

  return {
    content: fileContent,
    revision: currentRevision,
  };
}
