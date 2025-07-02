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

        CREATE TABLE IF NOT EXISTS data.pitfalls (
            id serial,
            level integer,
            geom geometry(Point, 3857),
            CONSTRAINT pitfalls_pkey PRIMARY KEY (id),
            CONSTRAINT pitfalls_levels_key FOREIGN KEY (level) REFERENCES data.levels(id)
        );

        CREATE TABLE IF NOT EXISTS data.bonus (
            id serial,
            level integer,
            geom geometry(Point, 3857),
            CONSTRAINT bonus_pkey PRIMARY KEY (id),
            CONSTRAINT bonus_levels_key FOREIGN KEY (level) REFERENCES data.levels(id)
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

    for (let i = 0; i < params.levels.length; i++) {
        let entry = params.levels[i];
        if (entry.type === 'level' && entry.options) {
            let l = entry.options;
            let insertion = `
                INSERT INTO data.levels (player, target)
                VALUES (
                    ST_SetSRID(ST_POINT(${l.player[0]}, ${l.player[1]}), 3857),
                    ST_SetSRID(ST_POINT(${l.target[0]}, ${l.target[1]}), 3857)
                )
                RETURNING id;
            `
            let result = await db.query(insertion);
            let index = result.rows[0].id;

            for (let zoom in l.hints) {
                let hint = `
                    INSERT INTO data.hints (level, zoom, hint)
                    VALUES (${index}, ${zoom}, '${l.hints[zoom]}')
                `
                await db.query(hint);
            }

            for (let j = 0; j < l.pitfalls.length; j++) {
                let p = l.pitfalls[j];
                let pitfall = `
                    INSERT INTO data.pitfalls (level, geom)
                    VALUES (${index}, ST_SetSRID(ST_POINT(${p[0]}, ${p[1]}), 3857))
                `
                await db.query(pitfall);
            }

            for (let j = 0; j < l.bonus.length; j++) {
                let b = l.bonus[j];
                let bonus = `
                    INSERT INTO data.bonus (level, geom)
                    VALUES (${index}, ST_SetSRID(ST_POINT(${b[0]}, ${b[1]}), 3857))
                `
                await db.query(bonus);
            }
        }
    }
}

export { clearDB, createTables, insertLevels }