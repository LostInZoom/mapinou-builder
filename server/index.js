import { db } from "../.database/credentials.js";

import * as fs from 'fs';
import * as path from 'path';
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

app.use('/', express.static('dist'));

app.get('/cartogame/configuration', (req, res) => {
	res.json(params);
	return res;
});

app.post('/cartogame/registration', jsonParser, (req, res) => {
	createSession(req.body).then((index) => {
		res.send(JSON.stringify({ sessionId: index }));
	});
});

app.post('/cartogame/verification', jsonParser, (req, res) => {
	verifySession(req.body.sessionId).then((isPresent) => {
		res.send(JSON.stringify({ isPresent: isPresent }));
	});
});

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});

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
        SELECT id
		FROM data.sessions
		WHERE id = ${index};
    `
	try {
		let result = await db.query(verification);
		if (result.rows.length > 0) {
			return true;
		} else {
			return false
		}
	} catch {
		return -1;
	}
}