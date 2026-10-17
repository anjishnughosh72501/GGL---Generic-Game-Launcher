/**
 * Generic Valve KeyValues / VDF Parser
 * Parses Steam .vdf and .acf files into nested JavaScript objects
 */

export type VDFObject = {
  [key: string]: string | VDFObject;
};

export function parseVDF(text: string): VDFObject {
  // Strip comments (// to end of line)
  const clean = text.replace(/\/\/[^\r\n]*/g, '');

  // Tokenize: strings in quotes, unquoted words, { and }
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|([^\s"{}\\]+)|([{])|([}])/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(clean)) !== null) {
    if (match[1] !== undefined) {
      // Quoted string - unescape escaped characters (e.g. \\ -> \)
      tokens.push(match[1].replace(/\\([\\"/])/g, '$1'));
    } else if (match[2] !== undefined) {
      // Bare token
      tokens.push(match[2]);
    } else if (match[3] !== undefined) {
      tokens.push('{');
    } else if (match[4] !== undefined) {
      tokens.push('}');
    }
  }

  let index = 0;

  function parseObject(): VDFObject {
    const result: VDFObject = {};

    while (index < tokens.length) {
      const token = tokens[index];

      if (token === '}') {
        index++;
        return result;
      }

      if (token === '{') {
        // Unexpected naked opening bracket
        index++;
        continue;
      }

      // Key
      const key = token;
      index++;

      if (index >= tokens.length) {
        break;
      }

      const nextToken = tokens[index];
      if (nextToken === '{') {
        // Nested object
        index++;
        result[key] = parseObject();
      } else if (nextToken === '}') {
        // Key with empty value before closing
        result[key] = '';
      } else {
        // Value
        result[key] = nextToken;
        index++;
      }
    }

    return result;
  }

  return parseObject();
}

/**
 * Extracts Steam library folder paths from parsed libraryfolders.vdf
 */
export function extractLibraryFolders(vdfData: VDFObject): string[] {
  const folders: string[] = [];

  // Top level is usually "libraryfolders" or "LibraryFolders"
  const root =
    (vdfData['libraryfolders'] as VDFObject) ||
    (vdfData['LibraryFolders'] as VDFObject) ||
    vdfData;

  for (const [key, val] of Object.entries(root)) {
    if (typeof val === 'object' && val !== null) {
      // New format: "0": { "path": "C:\\...", "apps": { ... } }
      const pathVal = val['path'];
      if (typeof pathVal === 'string' && pathVal.trim()) {
        folders.push(pathVal.trim());
      }
    } else if (typeof val === 'string' && /^\d+$/.test(key)) {
      // Old format: "1": "D:\\SteamLibrary"
      if (val.trim()) {
        folders.push(val.trim());
      }
    }
  }

  return folders;
}
