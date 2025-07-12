import express from 'express';
import { engine } from 'express-handlebars';
import handlebars from 'handlebars';
import mongodb from 'mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import session from 'express-session';

const app = express();

app.engine(
	'hbs',
	engine({
		defaultLayout: 'main',
		extname: 'hbs',
		layoutsDir: './views/layouts'
	})
);
app.set('view engine', 'hbs');
app.set('views', './views');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.use(
	session({
		secret: 'secret_key',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24,
			sameSite: 'lax',
			secure: false
		}
	})
);
app.use((req, res, next) => {
	res.locals.user = req.session.user || null;
	next();
});

app.use((req, res, next) => {
	res.locals.currentPath = req.path;
	next();
});

handlebars.registerHelper('dateFix', (date) => {
	return new Date(date).toLocaleString('en-US', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric'
	});
});

handlebars.registerHelper('inc', function (value) {
	return Number(value) + 1;
});

handlebars.registerHelper('increment', (value) => parseInt(value) + 1);
handlebars.registerHelper('decrement', (value) => parseInt(value) - 1);

handlebars.registerHelper('gt', (a, b) => a > b);
handlebars.registerHelper('lt', (a, b) => a < b);
handlebars.registerHelper('eq', (a, b) => a === b);

handlebars.registerHelper('cutWords', function (text, count) {
	if (!text) return '';
	const words = text.split(' ');
	return words.slice(0, count).join(' ') + (words.length > count ? '...' : '');
});

let mongoClient = new mongodb.MongoClient('mongodb://localhost:27017');
let db = mongoClient.db('surveyApp');
async function runDb() {
	try {
		await mongoClient.connect();
	} catch (e) {
		console.log(`DB error: ${e.message}`);
	}
}
runDb();

app.get('/', async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const limit = 12;
	const skip = (page - 1) * limit;
	let data = await db
		.collection('surveys')
		.find({ private: { $in: [false, null] } })
		.skip(skip)
		.limit(limit)
		.toArray();

	const totalCount = await db
		.collection('surveys')
		.countDocuments({ private: { $in: [false, null] } });
	const totalPages = Math.ceil(totalCount / limit);

	if (req.query.notification) {
		let notification = req.query.notification;
		return res.render('index', {
			title: 'Main Page',
			notification,
			data,
			totalCount,
			totalPages,
			page
		});
	}
	res.render('index', { title: 'Main Page', data, totalCount, totalPages, page });
});

app.get('/login', (req, res) => {
	if (req.query.notification) {
		let notification = req.query.notification;
		return res.render('login', { title: 'Login Page', notification });
	}

	res.render('login', { title: 'Login Page' });
});

app.post('/login', async (req, res) => {
	const user = await db.collection('users').findOne({ username: req.body.username });

	if (!user) {
		return res.redirect('/login?notification=Username or password incorrect');
	}

	const valid = await bcrypt.compare(req.body.password, user.password);

	if (valid) {
		req.session.user = user;
		return res.redirect('/');
	} else {
		return res.redirect('/login?notification=Username or password incorrect');
	}
});

app.get('/login/registration', (req, res) => {
	if (req.query.notification) {
		let notification = req.query.notification;
		return res.render('registration', { title: 'Create an account: Error', notification });
	}
	res.render('registration', { title: 'Create an account' });
});

app.post('/login/registration', async (req, res) => {
	const isUserExist = await db.collection('users').findOne({ username: req.body.username });
	if (isUserExist) {
		return res.redirect('/login/registration?notification=User is already exist');
	}

	await db.collection('users').insertOne({
		username: req.body.username,
		password: await bcrypt.hash(req.body.password, 10)
	});
	res.redirect('/login');
});

app.get('/create', (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login?notification=must be authorized');
	}
	res.render('create', { title: 'Create a survey' });
});

app.post('/create', async (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login?notification=must be authorized');
	}
	const questions = req.body.questions.map((q) => ({
		_id: new ObjectId(),
		text: q.text,
		answers: q.answers.map((ans) => ({
			text: ans.text,
			votes: 0
		}))
	}));

	const result = await db.collection('surveys').insertOne({
		title: req.body.title,
		description: req.body.description,
		private: req.body.private == 'on', //true OR undefined
		createdAt: new Date(),
		questions: questions,
		createdBy: req.session.user._id
	});

	await db
		.collection('users')
		.updateOne({ _id: req.session.user._id }, { $push: { surveys: result.insertedId } });

	res.redirect('/');
});

app.get('/list', async (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login?notification=must be authorized');
	}
	const surveys = await db.collection('surveys').find({ createdBy: req.session.user._id }).toArray();
	res.render('list', { title: 'User`s surveys', data: surveys });
});

app.get('/survey/:id', async (req, res) => {
	let id = req.params.id;
	const surveyData = await db.collection('surveys').findOne({ _id: new ObjectId(id) });

	if (!surveyData) {
		return res.status(404).redirect('/?notification=Survey not found');
	}

	if (
		surveyData.private &&
		(!req.session.user || surveyData.createdBy.toString() !== req.session.user._id.toString())
	) {
		return res.status(403).send('Forbidden');
	}

	res.render('survey', {
		title: surveyData.title,
		description: surveyData.description,
		data: surveyData
	});
});

app.get('/survey/:id/delete', async (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login?notification=must be authorized');
	}
	let id = req.params.id;
	const surveyData = await db.collection('surveys').findOne({ _id: new ObjectId(id) });

	if (!surveyData) {
		return res.status(404).send('Survey not found');
	}
	if (surveyData.createdBy.toString() !== req.session.user._id.toString()) {
		return res.redirect('/?notification=NO ACCESS: you are not the owner of this survey');
	}

	await db.collection('surveys').deleteOne({ _id: new ObjectId(id) });

	res.redirect(`/?notification=survey with id: ${id} deleted`);
});

app.post('/survey/:id/vote', async (req, res) => {
	let id = req.params.id;
	const surveyData = await db.collection('surveys').findOne({ _id: new ObjectId(id) });

	if (!surveyData) {
		return res.status(404).send('Survey not found');
	}

	const updatedQuestions = surveyData.questions.map((question, index) => {
		const answerKey = `question-${index}`;
		const selectedAnswerText = req.body[answerKey];

		const updatedAnswers = question.answers.map((answer) => {
			if (answer.text === selectedAnswerText) {
				return { ...answer, votes: answer.votes + 1 };
			}
			return answer;
		});

		return {
			...question,
			answers: updatedAnswers
		};
	});

	await db
		.collection('surveys')
		.updateOne({ _id: new ObjectId(id) }, { $set: { questions: updatedQuestions } });

	res.redirect(`/survey/results/${id}`);
});

app.get('/survey/results/:id', async (req, res) => {
	let id = req.params.id;
	const surveyData = await db.collection('surveys').findOne({ _id: new ObjectId(id) });

	if (!surveyData) {
		return res.status(404).send('Survey not found');
	}

	const questionData = surveyData.questions.map((q) => {
		const answers = Array.isArray(q.answers) ? q.answers : [];
		return {
			text: q.text,
			labels: JSON.stringify(answers.map((a) => a.text.trim())),
			votes: JSON.stringify(answers.map((a) => a.votes))
		};
	});

	res.render('viewSurvey', {
		title: surveyData.title,
		description: surveyData.description,
		data: surveyData,
		questionData
	});
});

app.get('/survey/:id/edit', async (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login?notification=must be authorized');
	}
	let id = req.params.id;
	const surveyData = await db.collection('surveys').findOne({ _id: new ObjectId(id) });

	res.render('create', { title: 'Edit a survey', data: surveyData });
});

app.post('/survey/:id/edit', async (req, res) => {
	if (!req.session.user) {
		return res.redirect('/login?notification=must be authorized');
	}
	let id = req.params.id;

	const existingSurvey = await db.collection('surveys').findOne({ _id: new ObjectId(id) });

	const questions = req.body.questions.map((q, qIndex) => {
		const existingQuestion = existingSurvey.questions[qIndex];

		return {
			_id: new ObjectId(q._id),
			text: q.text,
			answers: q.answers.map((ans, aIndex) => {
				const oldVotes = existingQuestion?.answers?.[aIndex]?.votes || 0;
				return {
					text: ans.text,
					votes: oldVotes
				};
			})
		};
	});

	await db.collection('surveys').updateOne(
		{ _id: new ObjectId(id) },
		{
			$set: {
				title: req.body.title,
				description: req.body.description,
				createdAt: new Date(),
				questions: questions,
				createdBy: req.session.user._id
			}
		}
	);
	res.redirect('/list');
});

app.get('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/login');
	});
});

app.use((req, res) => {
	res.status(404).render('404', {
		title: 'Page Not Found'
	});
});

app.listen(3008, () => {
	console.log('Server is running: localhost:3008');
});
