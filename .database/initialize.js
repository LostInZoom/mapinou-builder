import { db } from "./credentials.js";
import { clearDB, createTables } from "./tools.js";

// Start by clearing the database from its table
clearDB(db).then(() => {
    createTables(db).then(() => {
        process.exit();
    });
});