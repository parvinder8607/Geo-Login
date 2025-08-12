import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'userDB.json');
let db = {};

export const userDB = {
  get: (username) => db[username],
  set: (username, data) => {
    db[username] = data;
    fs.writeFileSync(filePath, JSON.stringify(db, null, 2));
  },
};
