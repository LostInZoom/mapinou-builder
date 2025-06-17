import * as fs from 'fs';
import { load } from "js-yaml";
import express from 'express';

const file = fs.readFileSync('./server/configuration.yml', { encoding: 'utf-8' });
const params = load(file);

const app = express();
const port = 8001;
const __dirname = import.meta.dirname;

app.use('/cartogame/configuration', (req, res) => {
	res.json(params);
	return res;
});

app.use('/cartogame/registration', (req, res) => {
	res.json({ sessionId: 512 });
	return 512;
});

app.use('/', express.static('dist'));

app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});