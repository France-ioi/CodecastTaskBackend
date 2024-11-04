import {Given, Then} from '@cucumber/cucumber';
import {simpleGit, SimpleGit, SimpleGitOptions} from 'simple-git';
import fs from 'fs';

const FAKE_GIT_REPO_PATH = '/tmp/git-repo-test';

interface GitStepsContext {
  currentRevisionNumber: string,
}

Given(/^there is a fake Git repository$/, async function (this: GitStepsContext) {
  const repoPath = FAKE_GIT_REPO_PATH;

  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
  };

  const doesFolderExist = fs.existsSync(repoPath + '/.git');
  if (doesFolderExist) {
    fs.rmSync(repoPath, {force: true, recursive: true});
  }
  fs.mkdirSync(repoPath, {recursive: true});

  const git: SimpleGit = simpleGit(options);
  await git.init();

  fs.writeFileSync(`${repoPath}/test.txt`, `Test
Git
File
Sample`);
  fs.mkdirSync(`${repoPath}/subfolder`);
  fs.writeFileSync(`${repoPath}/subfolder/subfile.txt`, 'Test');

  await git.add(['test.txt', 'subfolder/subfile.txt']);
  await git.commit('Commit');

  await git.checkoutLocalBranch('other');
  fs.writeFileSync(`${repoPath}/test2.txt`, `Test
Git
File
Sample
Changed`);
  await git.add(['test2.txt']);
  await git.commit('Commit other');
  await git.checkout('master');

  this.currentRevisionNumber = await git.revparse(['HEAD']);
});

Then(/^I update the current revision number of the repository at "([^"]*)"$/, async function (this: GitStepsContext, repoPath: string) {
  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
  };
  const git: SimpleGit = simpleGit(options);

  this.currentRevisionNumber = await git.revparse(['HEAD']);
});

Given(/^I make a commit on the fake Git repository changing the file "([^"]*)" to this content: "([^"]*)"$/, async function (this: GitStepsContext, file: string, content: string) {
  const repoPath = FAKE_GIT_REPO_PATH;
  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
  };

  const git: SimpleGit = simpleGit(options);

  fs.writeFileSync(`${repoPath}/${file}`, content);
  await git.commit('Change content', [`${repoPath}/${file}`]);
});
