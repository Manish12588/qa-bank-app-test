import fs from "fs";

export class JsonHelper {
  static readJson(filePath: string): Record<string, string>[] {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")); //Converts a JavaScript Object Notation (JSON) string into an object.
  }
}
