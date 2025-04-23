/**
 * Clear the tables from the given database.
 * @param {Pool} db - The database to clear the tables from.
 */
async function clearDB(db) {
    let query = `DROP SCHEMA IF EXISTS data CASCADE;`
    await db.query(query);
    query = `CREATE SCHEMA IF NOT EXISTS data`;
    await db.query(query);
}

async function createTables(db) {
    const TABLES = `
        CREATE TABLE IF NOT EXISTS data.sessions (
            id serial,
            user_agent character varying(500),
            CONSTRAINT sessions_pkey PRIMARY KEY (id)
        );

        CREATE TABLE IF NOT EXISTS data.survey (
            id serial,
            session integer,
            question character varying(1000),
            answer character varying(1000),
            CONSTRAINT survey_pkey PRIMARY KEY (id),
            CONSTRAINT survey_sessions_key FOREIGN KEY (session) REFERENCES data.sessions(id)
        );

        CREATE TABLE IF NOT EXISTS data.sets (
            id serial,
            player geometry(Point, 3857),
            target geometry(Point, 3857),
            CONSTRAINT sets_pkey PRIMARY KEY (id)
        );

        CREATE TABLE IF NOT EXISTS data.hints (
            id serial,
            set integer,
            zoom integer,
            CONSTRAINT hints_pkey PRIMARY KEY (id),
            CONSTRAINT hints_sets_key FOREIGN KEY (set) REFERENCES data.sets(id)
        );

        CREATE TABLE IF NOT EXISTS data.pitfalls (
            id serial,
            set integer,
            geom geometry(Point, 3857),
            CONSTRAINT pitfalls_pkey PRIMARY KEY (id),
            CONSTRAINT pitfalls_sets_key FOREIGN KEY (set) REFERENCES data.sets(id)
        );

        CREATE TABLE IF NOT EXISTS data.bonus (
            id serial,
            set integer,
            geom geometry(Point, 3857),
            CONSTRAINT bonus_pkey PRIMARY KEY (id),
            CONSTRAINT bonus_sets_key FOREIGN KEY (set) REFERENCES data.sets(id)
        );

        CREATE TABLE IF NOT EXISTS data.games (
            id serial,
            session integer,
            set integer,
            score integer,
            CONSTRAINT games_pkey PRIMARY KEY (id),
            CONSTRAINT games_sessions_key FOREIGN KEY (session) REFERENCES data.sessions(id),
            CONSTRAINT games_sets_key FOREIGN KEY (set) REFERENCES data.sets(id)
        );
    `
    await db.query(TABLES);
}

export { clearDB, createTables }