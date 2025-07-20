import { db } from "../.database/credentials.js";

import * as fs from 'fs';
import { load } from "js-yaml";
import express from 'express';
import bodyParser from 'body-parser';

const file = fs.readFileSync('./server/configuration.yml', { encoding: 'utf-8' });
const params = load(file);

fs.readdir('./server/svg', (error, files) => {
	params.svgs = {};

	files.forEach((file) => {
		let f = fs.readFileSync('./server/svg/' + file, { encoding: 'utf-8' })
		params.svgs[file.replace(/\.[^/.]+$/, "")] = f;
	})
});

const app = express();
const port = 8001;

const jsonParser = bodyParser.json();

// app.use('/mapinou', express.static(path.join(__dirname, 'dist/mapinou')));
app.use('/', express.static('dist'));

app.get('/mapinou/configuration', (req, res) => {
	res.json(params);
	return res;
});

app.post('/mapinou/registration', jsonParser, (req, res) => {
	createSession(req.body).then((index) => {
		res.send(JSON.stringify({ sessionId: index }));
	});
});

app.post('/mapinou/verification', jsonParser, (req, res) => {
	verifySession(req.body.sessionId).then((data) => {
		res.send(JSON.stringify(data));
	});
});

app.post('/mapinou/consent', jsonParser, (req, res) => {
	giveConsent(req.body.session).then((done) => {
		res.send(JSON.stringify({ done: done }));
	});
});

app.post('/mapinou/form', jsonParser, (req, res) => {
	insertForm(req.body).then((done) => {
		res.send(JSON.stringify({ done: done }));
	});
});

app.post('/mapinou/results', jsonParser, (req, res) => {
	insertResults(req.body).then((highscores) => {
		res.send(JSON.stringify(highscores));
	});
});

let server = app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

server.keepAliveTimeout = 30000;

async function createSession(options) {
    let creation = `
        INSERT INTO data.sessions (user_agent, device, orientation, os, width, height)
        VALUES (
			'${options.userAgent}',
			'${options.device}', '${options.orientation}', '${options.os}', 
			${options.width}, ${options.height}
		)
        RETURNING id;
    `
	try {
		let result = await db.query(creation);
		let index = result.rows[0].id;
		return index;
	} catch {
		return -1;
	}
}

async function verifySession(index) {
	let verification = `
        SELECT id, consent, form
		FROM data.sessions
		WHERE id = ${index};
    `
	try {
		let result = await db.query(verification);
		if (result.rows.length > 0) {
			return {
				isPresent: true,
				consent: result.rows[0].consent,
				form: result.rows[0].form,
			};
		} else {
			return { isPresent: false };
		}
	} catch {
		return {};
	}
}

async function giveConsent(index) {
	let verification = `
        UPDATE data.sessions
		SET consent = true
		WHERE id = ${index};
    `
	try {
		await db.query(verification);
		return true
	} catch {
		return false;
	}
}

async function insertForm(data) {
	let answers = [];
	for (let q = 0; q < data.form.length; q++) {
		let answer = data.form[q].join(', ').replace('<br>', ' ').replace("'", "''");
		answers.push(`(${data.session}, ${q + 1}, '${answer}')`);
	}
	let values = answers.join(', ');
	let insertion = `
        INSERT INTO data.survey (session, question, answer)
        VALUES ${values};

		UPDATE data.sessions
		SET form = true
		WHERE id = ${data.session};
    `
	try {
		await db.query(insertion);
		return true
	} catch {
		return false;
	}
}

async function insertResults(data) {
	let levelQuery = `
        SELECT id
		FROM data.levels
		WHERE tier = ${data.tier} AND level = ${data.level};
    `

	let highscores = { highscores: [] };
	try {
		let result = await db.query(levelQuery);
		if (result.rows.length > 0) {
			let level = result.rows[0].id;
			let insertion = `
				DELETE FROM data.games
				WHERE session = ${data.session} AND level = ${level};

				INSERT INTO data.games (session, level, score)
				VALUES (${data.session}, ${level}, ${data.score});
			`
			await db.query(insertion);

			let highscoresQuery = `
				SELECT session, score
				FROM data.games
				WHERE level = ${level};
			`
			let hs = await db.query(highscoresQuery);
			highscores.highscores = hs.rows;
		}
		return highscores;
	} catch {
		return highscores;
	}
}