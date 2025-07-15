import { db } from "./credentials.js";
import * as fs from 'fs';
import { load } from "js-yaml";

/**
 * Clear the tables from the given database.
 * @param {Pool} db - The database to clear the tables from.
 */
async function clearDB() {
    let query = `DROP SCHEMA IF EXISTS data CASCADE;`
    await db.query(query);
    query = `CREATE SCHEMA IF NOT EXISTS data`;
    await db.query(query);
}

async function createTables() {
    const TABLES = `
        CREATE TABLE IF NOT EXISTS data.sessions (
            id serial,
            user_agent character varying(500),
            device character varying(100),
            orientation character varying(100),
            os character varying(100),
            width integer,
            height integer,
            consent boolean DEFAULT False,
            form boolean DEFAULT False,
            CONSTRAINT sessions_pkey PRIMARY KEY (id)
        );

        CREATE TABLE IF NOT EXISTS data.questions (
            id serial,
            value character varying(1000),
            CONSTRAINT questions_pkey PRIMARY KEY (id)
        );

        CREATE TABLE IF NOT EXISTS data.survey (
            id serial,
            session integer,
            question integer,
            answer text,
            CONSTRAINT survey_pkey PRIMARY KEY (id),
            CONSTRAINT survey_sessions_key FOREIGN KEY (session) REFERENCES data.sessions(id),
            CONSTRAINT survey_questions_key FOREIGN KEY (question) REFERENCES data.questions(id)
        );

        CREATE TABLE IF NOT EXISTS data.levels (
            id serial,
            tier int,
            level int,
            player geometry(Point, 3857),
            target geometry(Point, 3857),
            CONSTRAINT levels_pkey PRIMARY KEY (id)
        );

        CREATE TABLE IF NOT EXISTS data.hints (
            id serial,
            level integer,
            zoom integer,
            hint character varying(1000),
            CONSTRAINT hints_pkey PRIMARY KEY (id),
            CONSTRAINT hints_levels_key FOREIGN KEY (level) REFERENCES data.levels(id)
        );

        CREATE TABLE IF NOT EXISTS data.enemies (
            id serial,
            level integer,
            geom geometry(Point, 3857),
            CONSTRAINT enemies_pkey PRIMARY KEY (id),
            CONSTRAINT enemies_levels_key FOREIGN KEY (level) REFERENCES data.levels(id)
        );

        CREATE TABLE IF NOT EXISTS data.helpers (
            id serial,
            level integer,
            geom geometry(Point, 3857),
            CONSTRAINT helpers_pkey PRIMARY KEY (id),
            CONSTRAINT helpers_levels_key FOREIGN KEY (level) REFERENCES data.levels(id)
        );

        CREATE TABLE IF NOT EXISTS data.games (
            id serial,
            session integer,
            level integer,
            score integer,
            CONSTRAINT games_pkey PRIMARY KEY (id),
            CONSTRAINT games_sessions_key FOREIGN KEY (session) REFERENCES data.sessions(id),
            CONSTRAINT games_levels_key FOREIGN KEY (level) REFERENCES data.levels(id)
        );

        CREATE TABLE IF NOT EXISTS data.interactions (
            id serial,
            session integer,
            level integer,
            type character varying (100),
            CONSTRAINT interactions_pkey PRIMARY KEY (id),
            CONSTRAINT interactions_sessions_key FOREIGN KEY (session) REFERENCES data.sessions(id),
            CONSTRAINT interactions_levels_key FOREIGN KEY (level) REFERENCES data.levels(id)
        );
    `
    await db.query(TABLES);
}

async function insertLevels() {
    const file = fs.readFileSync('./server/configuration.yml', { encoding: 'utf-8' });
    const params = load(file);

    for (let i = 0; i < params.form.length; i++) {
        let q = params.form[i].question;
        // Remove breaks
        q = q.replace('<br>', ' ');
        // Replace single quotes with two single quotes to avoid errors during insertion
        q = q.replace("'", "''");
        let insertion = `
            INSERT INTO data.questions (value)
            VALUES ('${q}');
        `
        await db.query(insertion);
    }

    let tier = 1;
    for (let t = 0; t < params.levels.length; t++) {
        let entry = params.levels[t];

        if (entry.type === 'tier') {
            let levels = entry.content;
            for (let l = 0; l < levels.length; l++) {
                let level = levels[l];

                if (level.player) {
                    let insertion = `
                        INSERT INTO data.levels (tier, level, player, target)
                        VALUES (
                            ${tier},
                            ${l + 1},
                            ST_SetSRID(ST_POINT(${level.player[0]}, ${level.player[1]}), 3857),
                            ST_SetSRID(ST_POINT(${level.target[0]}, ${level.target[1]}), 3857)
                        )
                        RETURNING id;
                    `
                    let result = await db.query(insertion);
                    let index = result.rows[0].id;

                    for (let zoom in level.hints) {
                        let hint = `
                            INSERT INTO data.hints (level, zoom, hint)
                            VALUES (${index}, ${zoom}, '${level.hints[zoom]}')
                        `
                        await db.query(hint);
                    }

                    for (let j = 0; j < level.enemies.length; j++) {
                        let p = level.enemies[j];
                        let enemies = `
                            INSERT INTO data.enemies (level, geom)
                            VALUES (${index}, ST_SetSRID(ST_POINT(${p[0]}, ${p[1]}), 3857))
                        `
                        await db.query(enemies);
                    }

                    for (let j = 0; j < level.helpers.length; j++) {
                        let b = level.helpers[j];
                        let helpers = `
                            INSERT INTO data.helpers (level, geom)
                            VALUES (${index}, ST_SetSRID(ST_POINT(${b[0]}, ${b[1]}), 3857))
                        `
                        await db.query(helpers);
                    }
                }
            }

            ++tier;
        }
    }

    let s = `
        INSERT INTO data.sessions (consent, form)
        VALUES
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True),
            (True, True);
    `

    await db.query(s);

    // INSERT FAKE SESSIONS RESULTS
    let helpers = `
        INSERT INTO data.games (session, level, score)
        VALUES
            (1, 2, 584),
            (2, 2, 1204),
            (3, 2, 103),
            (4, 2, 84),
            (5, 2, 852),
            (6, 2, 1),
            (7, 2, 17),
            (8, 2, 21),
            (9, 2, 152),
            (10, 2, 62),
            (11, 2, 30),
            (12, 2, 74);
    `
    await db.query(helpers);
}

export { clearDB, createTables, insertLevels }