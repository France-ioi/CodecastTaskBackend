import {RemoteLib} from './remote_lib';
import Docker from 'dockerode';
import fs, {createWriteStream} from 'fs';
import {randomUUID} from 'crypto';
import got from 'got';
import stream from 'stream';
import path from 'path';

const OPENCV_IMAGE = 'hdgigante/python-opencv:4.9.0-alpine';
const CACHE_FOLDER = 'cache';
const ALLOWED_CALLS = ['imread', 'cvtColor', 'flip', 'rotate', 'blur', 'resize', 'Canny', 'imwrite'];

export class ImageCache {
  generateIdentifier(): string {
    return randomUUID() + '.jpg';
  }

  getCachePath(key: string): string {
    return `${CACHE_FOLDER}/${key}`;
  }
}

interface FileArg {
  fileType: string,
  fileUrl: string,
}

function isFileArg(arg: unknown): arg is FileArg {
  return 'object' === typeof arg && null !== arg && 'fileType' in arg;
}

const imageCache = new ImageCache();

class EchoStream extends stream.Writable {
  private content = '';
  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    // eslint-disable-next-line
    this.content += chunk.toString();
    callback();
  }

  getContent(): string {
    return this.content;
  }
}

export class OpenCvLib extends RemoteLib {
  private dockerInstance: Docker|null = null;

  async executeRemoteCall(callName: string, args: unknown[]): Promise<{fileType: 'image', fileUrl: string}> {
    if (-1 === ALLOWED_CALLS.indexOf(callName)) {
      throw new TypeError(`Unauthorized OpenCV call name: ${callName}`);
    }

    if (!this.dockerInstance) {
      this.initDockerInstance();
    }

    const dockerInstance = this.dockerInstance as Docker;

    const images = await dockerInstance.listImages();
    if (!images.find(image => image.RepoTags && image.RepoTags.includes(OPENCV_IMAGE))) {
      await new Promise(resolve => {
        void dockerInstance.pull(OPENCV_IMAGE, (err: unknown, stream: NodeJS.ReadableStream) => {
          dockerInstance.modem.followProgress(stream, resolve);
        });
      });
    }

    const resultImageName = imageCache.generateIdentifier();

    const program = `import cv2
result = cv2.${callName}(${await this.formatArguments(args)})
cv2.imwrite('${resultImageName}', result)`;

    fs.writeFileSync(`${CACHE_FOLDER}/app.py`, program);

    const outputStream = new EchoStream();
    const cacheFolder = path.join(__dirname, '../../', CACHE_FOLDER);

    const data = await dockerInstance.run(OPENCV_IMAGE, ['python3', 'app.py'], outputStream, {
      HostConfig: {
        Binds: [`${cacheFolder}:/opt/build`],
        AutoRemove: true,
      },
    }) as {StatusCode: number}[];

    if (0 !== data[0].StatusCode) {
      throw new Error(outputStream.getContent().trim());
    }

    return {
      fileType: 'image',
      fileUrl: '/image-cache/' + resultImageName,
    };
  }

  async formatArguments(args: unknown[]): Promise<string> {
    const argsString = [];
    for (const arg of args) {
      argsString.push(await this.convertArgument(arg));
    }

    return `${argsString.join(', ')}`;
  }

  async convertArgument(arg: unknown): Promise<string> {
    if ('object' === typeof arg && isFileArg(arg)) {
      const fileName = arg.fileUrl.split('/').pop() ?? '';
      if (!fileName.match(/^[a-zA-Z0-9-]+\.[a-z]+$/)) {
        throw new TypeError(`File name "${fileName}" does not match the required pattern`);
      }

      return `cv2.imread("${fileName ?? ''}")`;
    }
    if ('string' === typeof arg) {
      if (this.isImageUrl(arg)) {
        const imagePath = imageCache.generateIdentifier();
        await this.downloadImage(arg, imageCache.getCachePath(imagePath));

        return `"${imagePath}"`;
      }

      // Escape quotes to prevent Python custom code injection
      // eslint-disable-next-line
      arg = arg.replace(/"/g, '\\\"');

      return `"${String(arg)}"`;
    }

    if (Array.isArray(arg)) {
      const convertedArgs = await Promise.all(arg.map(element => this.convertArgument(element)));

      return `(${convertedArgs.join(', ')})`;
    }
    if ('number' === typeof arg) {
      return `${Number(arg)}`;
    }

    throw new TypeError(`Unaccepted argument type: ${String(arg)}`);
  }

  isImageUrl(arg: unknown): boolean {
    return 'string' === typeof arg && !!arg.match(/^https?:\/\/.+\.(jpg|png|gif|webp|avi)$/);
  }

  initDockerInstance(): void {
    this.dockerInstance = new Docker();
  }

  downloadImage(url: string, filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const downloadStream = got.stream(url);
      const fileWriterStream = createWriteStream(filePath);

      downloadStream
        .on('error', error => {
          reject(`Download failed: ${error.message}`);
        });

      fileWriterStream
        .on('error', error => {
          reject(`Could not write file to system: ${error.message}`);
        })
        .on('finish', () => {
          resolve();
        });

      downloadStream.pipe(fileWriterStream);
    });
  }
}
