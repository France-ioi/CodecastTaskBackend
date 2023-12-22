import {RemoteLib} from './remote_lib';
import Docker from 'dockerode';
import fs, {createWriteStream} from 'fs';
import {randomUUID} from 'crypto';
import got from 'got';
import stream from 'stream';
import path from 'path';

const OPENCV_IMAGE = 'hdgigante/python-opencv:4.8.1-alpine';
const CACHE_FOLDER = 'cache';

export class ImageCache {
  generateIdentifier(): string {
    return randomUUID() + '.jpg';
  }

  getCachePath(key: string): string {
    return `${CACHE_FOLDER}/${key}`;
  }
}

const imageCache = new ImageCache();

class EchoStream extends stream.Writable {
  private content = '';
  _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    // eslint-disable-next-line
    this.content += chunk.toString();
    // console.log(chunk.toString());
    callback();
  }

  getContent(): string {
    return this.content;
  }
}

export class OpenCvLib extends RemoteLib {
  private dockerInstance: Docker|null = null;

  async executeRemoteCall(callName: string, args: any[]): Promise<any> {
    if (!this.dockerInstance) {
      this.initDockerInstance();
    }

    const dockerInstance = this.dockerInstance as Docker;

    // await dockerInstance.pull(OPENCV_IMAGE, {});

    // console.log('time1', performance.now() - timing);

    const resultImageName = imageCache.generateIdentifier();

    const program = `import cv2
result = cv2.${callName}(${await this.formatArguments(args)})
cv2.imwrite('${resultImageName}', result)`;

    // console.log(program);

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
      throw new Error(outputStream.getContent().split('Traceback (')[0].trim());
    }

    //TODO: cleanup?

    return `image:${resultImageName}`;
  }

  async formatArguments(args: any[]): Promise<string> {
    const argsString = [];
    for (const arg of args) {
      argsString.push(await this.convertArgument(arg));
    }

    return `${argsString.join(', ')}`;
  }

  async convertArgument(arg: any): Promise<string> {
    if ('string' === typeof arg) {
      if ('image' === arg.split(':')[0]) {
        return `cv2.imread("${arg.split(':')[1]}")`;
      } else if (this.isImageUrl(arg)) {
        const imagePath = imageCache.generateIdentifier();
        // console.log('image url', imagePath);
        await this.downloadImage(arg, imageCache.getCachePath(imagePath));

        return `"${imagePath}"`;
      }

      return `"${arg}"`;
    }

    return String(arg);
  }

  isImageUrl(arg: any): boolean {
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
