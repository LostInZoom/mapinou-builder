import express from 'express';

const app = express()
const port = 8001
const __dirname = import.meta.dirname;

app.use('/', express.static('dist'));

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
})