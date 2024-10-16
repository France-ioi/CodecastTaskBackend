import {RemoteLib} from './remote_lib';
import Docker from 'dockerode';
import fs, {createWriteStream} from 'fs';
import {randomUUID} from 'crypto';
import got from 'got';
import stream from 'stream';
import path from 'path';

const OPENCV_IMAGE = 'hdgigante/python-opencv:4.9.0-alpine';
const CACHE_FOLDER = 'cache';

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
  fileName: string,
  fileUrl: string,
}

function isFileArg(arg: any): arg is FileArg {
  return 'object' === typeof arg && null !== arg && 'fileType' in arg;
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

    const images = await dockerInstance.listImages();
    if (!images.find(image => image.RepoTags && image.RepoTags.includes(OPENCV_IMAGE))) {
      await new Promise(resolve => {
        void dockerInstance.pull(OPENCV_IMAGE, (err: any, stream: NodeJS.ReadableStream) => {
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

    //TODO: cleanup?

    const originalName = args[0] as FileArg|string;
    const newName = [
      ...('imread' === callName ? [] : [callName]),
      'object' === typeof originalName && 'fileName' in originalName ? originalName.fileName : originalName,
    ].join('-');

    return {
      fileType: 'image',
      fileName: newName,
      fileUrl: '/image-cache/' + resultImageName,
    };
  }

  async formatArguments(args: any[]): Promise<string> {
    const argsString = [];
    for (const arg of args) {
      argsString.push(await this.convertArgument(arg));
    }

    return `${argsString.join(', ')}`;
  }

  async convertArgument(arg: any): Promise<string> {
    if ('object' === typeof arg && isFileArg(arg)) {
      return `cv2.imread("${arg.fileUrl.split('/').pop() ?? ''}")`;
    }
    if ('string' === typeof arg) {
      if (this.isImageUrl(arg)) {
        const imagePath = imageCache.generateIdentifier();
        // console.log('image url', imagePath);
        await this.downloadImage(arg, imageCache.getCachePath(imagePath));

        return `"${imagePath}"`;
      }

      return `"${arg}"`;
    }
    if (Array.isArray(arg)) {
      const convertedArgs = [];
      for (const element of arg) {
        convertedArgs.push(await this.convertArgument(element));
      }

      return `(${convertedArgs.join(', ')})`;
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
