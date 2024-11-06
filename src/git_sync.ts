import {pipe} from "fp-ts/function";
import * as D from "io-ts/Decoder";
import {ResetMode, simpleGit, SimpleGit, SimpleGitOptions} from 'simple-git';
import * as fs from 'fs';
import {CachePool} from "./caching";
import appConfig from "./config";

const keyFilePath = process.cwd() + '/keys/git_sync';

const repositoryDecoder = pipe(
  D.string,
  D.refine((str): str is string => 'test' !== appConfig.nodeEnv ? /[a-z0-9]+@.+\.git/.test(str) : true, 'valid_repository_format')
);

export const gitRepositoryBranchesDecoder = pipe(
  D.struct({
    repository: repositoryDecoder,
  }),
);

export const gitRepositoryFolderContentDecoder = pipe(
  D.struct({
    repository: repositoryDecoder,
    branch: D.string,
  }),
  D.intersect(D.partial({
    folder: D.string,
  })),
);

export const gitPullDecoder = pipe(
  D.struct({
    repository: repositoryDecoder,
    branch: D.string,
    file: D.string,
  }),
  D.intersect(D.partial({
    revision: D.string,
    source: D.string,
  })),
);

export const gitPushDecoder = pipe(
  D.struct({
    repository: repositoryDecoder,
    branch: D.string,
    file: D.string,
    revision: D.string,
    source: D.string,
    username: D.string,
    commitMessage: D.string,
  }),
);

export class NotUpToDateError extends Error {
}

export class GitConflictError extends Error {
  public conflictSource: string|undefined;
  public conflictRevision: string|undefined;

  setConflictSource(conflictSource: string): this {
    this.conflictSource = conflictSource;

    return this;
  }

  setConflictRevision(conflictRevision: string): this {
    this.conflictRevision = conflictRevision;

    return this;
  }
}

const gitSyncCachePool = new CachePool();

export async function getGitRepositoryBranches(repository: string) {
  const git = await initGitRepository(repository);

  const listRemotesRaw = await git.listRemote(['--heads']);

  return listRemotesRaw.split("\n").map(e => {
    return e.split('/heads/')[1];
  }).filter(a => undefined !== a);
}

export async function getRemoteLastRevision(git: SimpleGit, repository: string, branch: string): Promise<string|null> {
  const listRemotesRaw = await git.listRemote(['--heads', repository, branch]);

  const results = listRemotesRaw.split("\n").map(e => {
    return e.split("\t")[0];
  }).filter(a => undefined !== a);

  return results.length ? results[0] : null;
}

export async function getGitRepositoryFolderContent(repository: string, branch: string, folder?: string) {
  const git = await initGitRepository(repository);

  await gitSyncCachePool.get(`fetch:${repository}:${branch}`, 60, async () => {
    await git.fetch('origin', branch);
  });

  await git.checkout(branch);
  await git.reset(ResetMode.HARD, [`origin/${branch}`]);

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

async function initGitRepository(repository: string, gitUsername?: string): Promise<SimpleGit> {
  assertGitKeysExistence();

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

  const GIT_SSH_COMMAND = `ssh -i ${keyFilePath} -o IdentitiesOnly=yes`;
  git.env('GIT_SSH_COMMAND', GIT_SSH_COMMAND);

  git
    .addConfig('user.name', gitUsername ?? 'Git Sync')
    .addConfig('user.email', 'git-sync@france-ioi.org');

  // If there is a rebase, abort it
  try {
    await git.rebase(['--abort']);
  } catch (e) {
  }

  return git;
}

function getGitRepositoryPath(repository: string) {
  return process.cwd() + '/cache/' + repository;
}

export async function gitPull(repository: string, branch: string, file: string, revision?: string, source?: string) {
  const repoPath = getGitRepositoryPath(repository);
  const filePath = repoPath + '/' + file;

  const git = await initGitRepository(repository);

  await git.fetch('origin', branch);
  await git.checkout(branch, ['-f']);

  if (revision) {
    await git.reset(ResetMode.HARD, [revision]);
  } else {
    await git.reset(ResetMode.HARD, [`origin/${branch}`]);
  }

  if (!fs.existsSync(filePath)) {
    throw new TypeError(`This file does not exist on the repository: ${file}`);
  }

  if (undefined !== source) {
    fs.writeFileSync(filePath, source);
  }

  await git.commit('Before pull rebase', [filePath]);

  try {
    await git.pull('origin', branch, ['--rebase']);
  } catch (e: unknown) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    if (e instanceof Error && -1 !== e?.message.indexOf('CONFLICT')) {
      const lastRevision = await getRemoteLastRevision(git, repository, branch);

      const annotatedSource = fileContent
        .replace(/<<<<<<< HEAD/g, '<<<<<<< Remote changes')
        .replace(/>>>>>>> [a-z0-9]+ \(Before pull rebase\)/g, '>>>>>>> Your changes')
      throw (new GitConflictError())
        .setConflictSource(annotatedSource)
        .setConflictRevision(lastRevision!)
    }
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lastRevision = await getRemoteLastRevision(git, repository, branch);

  return {
    content: fileContent,
    revision: lastRevision,
  };
}

export async function gitPush(parameters: D.TypeOf<typeof gitPushDecoder>) {
  const {repository, branch, file, revision, source, username} = parameters;
  const git = await initGitRepository(repository, username);

  const lastRevision = await getRemoteLastRevision(git, repository, branch);
  if (null === lastRevision || lastRevision !== revision) {
    throw new NotUpToDateError(`You are not up to date, your revision is ${revision} and last revision is ${lastRevision}`);
  }

  await git.fetch('origin', branch);
  await git.checkout(branch, ['-f']);
  await git.reset(ResetMode.HARD, [revision]);

  const repoPath = getGitRepositoryPath(repository);
  const filePath = repoPath + '/' + file;

  if (!fs.existsSync(filePath)) {
    throw new TypeError(`This file does not exist on the repository: ${file}`);
  }

  fs.writeFileSync(filePath, source);

  await git.commit(parameters.commitMessage, filePath);

  await git.push('origin', branch);

  const currentRevision = await git.revparse(['HEAD']);

  return {
    revision: currentRevision,
  };
}

export function getGitPublicKeyContent() {
  assertGitKeysExistence();

  return fs.readFileSync(keyFilePath + '.pub', 'utf-8');
}

export function assertGitKeysExistence() {
  if (!fs.existsSync(keyFilePath)) {
    throw new Error("There is no SSH key to interact with the Git client. Create one following the README of this project.")
  }
}
