import { remote } from "electron";
import { save } from "save-file";
import toBuffer from "blob-to-buffer";
import { Book, Spine, Navigation } from "epubjs";
import fileUrl from "file-url";
import path from "path";
import process from "process";
import * as Vibrant from "node-vibrant";

interface BookInfo {
  id: string;
  title: string;
  author: string;
  publisher: string;
  path: string;
  bookmarks: any[];
  highlights: any[];
  bgColorFromCover: string;
  toc: TocItem[];
  locations: any;
  lastOpen?: number;
  coverPath?: string;
}

interface TocItem {
  label: string;
  children: TocItem[];
  href: string;
  cfi: string;
  percentage: number;
}

interface Database {
  has(key: string): boolean;
  insert(key: string, value: any): void;
}

function storeCover(
  book: Book,
  path: string,
  cb: (isSuccess: boolean) => void
): void {
  book.loaded.cover.then((cover) => {
    if (!cover) {
      cb(false);
      return;
    }
    try {
      book.archive.getBlob(cover).then((blb) => {
        toBuffer(blb, (err, buffer) => {
          if (err) throw err;
          save(buffer, path).then(() => {
            if (cb) {
              cb(true);
            }
          });
        });
      });
    } catch (err) {
      console.error(err);
    }
  });
}

function generateKey(filePath: string): string {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  return filePath.replace(/[ \/\.]/g, "");
}

function parshToc(book: Book): TocItem[] {
  const { toc } = book.navigation;
  const { spine } = book;

  const validateHref = (href: string): string => {
    if (href.startsWith("..")) {
      href = href.substring(2);
    }
    if (href.startsWith("/")) {
      href = href.substring(1);
    }
    return href;
  };

  const getSpineComponent = (href: string): string => {
    return href.split("#")[0];
  };

  const getPositonComponent = (href: string): string | undefined => {
    return href.split("#")[1];
  };

  const tocTree: TocItem[] = [];

  const createTree = (toc: any[], parrent: TocItem[]) => {
    for (let i = 0; i < toc.length; i += 1) {
      const href = validateHref(toc[i].href);
      const spineComponent = getSpineComponent(href);
      const positonComponent = getPositonComponent(href);
      const spineItem = spine.get(spineComponent);

      spineItem.load(book.load.bind(book)).then(() => {
        const el = spineItem.document.getElementById(positonComponent || "");
        const cfi = spineItem.cfiFromElement(el);
        const percentage = book.locations.percentageFromCfi(cfi);

        parrent[i] = {
          label: toc[i].label.trim(),
          children: [],
          href,
          cfi,
          percentage,
        };

        if (toc[i].subitems) {
          createTree(toc[i].subitems, parrent[i].children);
        }
      });
    }
  };

  createTree(toc, tocTree);
  return tocTree;
}

function getInfo(
  filePath: string,
  callback: (info: BookInfo, book: Book) => void
): void {
  if (!filePath || typeof filePath !== "string") {
    return;
  }

  const key = generateKey(filePath);
  const uri = fileUrl(filePath);
  const book = new Book(uri);

  book.ready
    .then(() => {
      return book.locations.generate();
    })
    .then((locations) => {
      const meta = book.package.metadata;

      const info: BookInfo = {
        id: key,
        title: meta.title,
        author: meta.creator,
        publisher: meta.publisher,
        path: uri,
        bookmarks: [],
        highlights: [],
        bgColorFromCover: "",
        toc: parshToc(book),
        locations,
      };

      if (callback) {
        callback(info, book);
      }
    });
}

function addToDB(
  file: string,
  db: Database,
  cb?: (info: BookInfo, db: Database) => void
): void {
  getInfo(file, (info, book) => {
    let key = info.id;
    info.lastOpen = new Date().getTime();

    if (db.has(key)) {
      if (cb) {
        cb(info, db);
      }
      return;
    }

    if (process.platform === "win32") {
      key = key.split("\\").pop() || key;
    }

    const coverPath = path.join(
      remote.app.getPath("appData"),
      "eplee",
      "cover",
      key
    );

    storeCover(book, coverPath, (isSuccess) => {
      if (isSuccess) {
        info.coverPath = fileUrl(coverPath);
        Vibrant.from(coverPath)
          .getPalette()
          .then((palette) => {
            if (palette && palette.DarkVibrant) {
              info.bgColorFromCover = palette.DarkVibrant.hex;
            }
          })
          .then(() => {
            db.insert(key, info);
          })
          .then(() => {
            if (cb) {
              cb(info, db);
            }
          })
          .catch((err) => {
            console.error(err);
            info.bgColorFromCover = "#6d6d6d";
            db.insert(key, info);
            if (cb) {
              cb(info, db);
            }
          });
      } else {
        info.bgColorFromCover = "#6d6d6d";
        db.insert(key, info);
        if (cb) {
          cb(info, db);
        }
      }
    });
  });
}

export { addToDB, storeCover, generateKey, getInfo, parshToc };
