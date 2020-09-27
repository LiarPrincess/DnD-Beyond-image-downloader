import { join, basename } from 'path';
import { default as axios } from 'axios';
import { promises as fs, createWriteStream } from 'fs';

(async () => {
  const htmDir = './html';
  const htmlFiles = await fs.readdir(htmDir);

  for (const htmFilename of htmlFiles) {
    if (!htmFilename.endsWith('.html')) {
      continue;
    }

    // Output dir
    const outputDir = join('./output', htmFilename.replace('.html', ''));
    try {
      await fs.mkdir(outputDir);
    } catch (error) { }

    // Download
    const htmlFile = join(htmDir, htmFilename);
    const html = await fs.readFile(htmlFile, 'utf-8');

    // We are looking for something like:
    // href="https://media-waterdeep.cursecdn.com/attachments/5/776/map-wm-pc.jpg"
    const hrefRegex = /https:\/\/media-waterdeep\.cursecdn\.com.*"/g;
    const hrefMatches = html.match(hrefRegex);
    if (!hrefMatches) {
      throw new Error('??');
    }

    for (const href of hrefMatches) {
      const endIndex = href.indexOf('"', 1);
      const link = href.slice(0, endIndex);

      if (!link.includes('attachments')) {
        continue;
      }

      // const isImage = link.endsWith('.png') || link.endsWith('.jpg');
      // if (!isImage) {
      //   continue;
      // }

      const x = htmFilename.replace('.html', '');
      const linkFilename = basename(link);
      const outputFile = join(outputDir, `${x}-${linkFilename}`);

      const alreadyDownloaded = await exists(outputFile);
      if (alreadyDownloaded) {
        continue;
      }

      try {
        console.log(link, '->', outputFile);
        await downloadStream(link, outputFile);
      } catch (error) {
        console.log(error, link);
      }
    }
  }

  console.log('Done');
})();

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

async function downloadStream(url: string, path: string): Promise<void> {
  const stream = createWriteStream(path);
  const response = await axios.get(url, { responseType: 'stream' });

  response.data.pipe(stream);

  return new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}
