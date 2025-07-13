// @ts-check
/* global describe, afterEach, beforeEach, before, after, it */

/** @typedef {import('supertest').SuperTest<import('supertest').Test>} SuperTest */
/** @typedef {import('chai').expect} expect */
/** @typedef {import('mocha')} mocha */
/** @type {import('supertest').SuperAgentTest} */

import request from 'supertest';
import app from '../index.js';
import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
let agent;
const mongoClient = new MongoClient('mongodb://localhost:27017');
let db;

before(async () => {
	await mongoClient.connect();
	db = mongoClient.db('surveyApp');
});

after(async () => {
	await mongoClient.close();
});

describe('GET /', () => {
	it('should return 200 OK', async () => {
		const res = await request(app).get('/');
		expect(res.status).to.equal(200);
	});
});

describe('GET /login (status 200 + title', () => {
	it('should return 200 OK', async () => {
		const res = await request(app).get('/login');
		expect(res.status).to.equal(200);
		expect(res.text).to.include('<title>Survey Maker | Login Page</title>');
	});
});

describe('GET /registration (status 200 + title', () => {
	it('should return 200 OK', async () => {
		const res = await request(app).get('/login/registration');
		expect(res.status).to.equal(200);
		expect(res.text).to.include('<title>Survey Maker | Create an account</title>');
	});
});

describe('POST /registration', () => {
	beforeEach(async () => {
		await db.collection('users').deleteOne({ username: '1' });
	});
	it('should return 200 OK', async () => {
		await request(app)
			.post('/login/registration')
			.send({ username: '1', password: '222' })
			.expect(302)
			.expect('Location', '/login');
	});
	afterEach(async () => {
		await db.collection('users').deleteOne({ username: '1' });
	});
});

describe('POST /registration | Error: user already exists', () => {
	before(async () => {
		await db
			.collection('users')
			.insertOne({ username: 'testSignUp', password: await bcrypt.hash('testpass', 10) });
	});
	it('should return Error', async () => {
		await request(app)
			.post('/login/registration')
			.send({ username: 'testSignUp', password: '222' })
			.expect(302)
			.expect('Location', '/login/registration?notification=User%20is%20already%20exist');
	});
	afterEach(async () => {
		await db.collection('users').deleteOne({ username: '1' });
	});
});

describe('GET /create (unauthenticated)', () => {
	it('should redirect to /login with notification', async () => {
		const res = await request(app).get('/create');
		expect(res.status).to.equal(302);
		expect(res.header.location).to.include('/login?notification=must%20be%20authorized');
	});
});

describe('POST /login (valid credentials)', () => {
	before(async () => {
		await db
			.collection('users')
			.insertOne({ username: 'testuser', password: await bcrypt.hash('testpass', 10) });
	});
	after(async () => {
		await db.collection('users').deleteOne({ username: 'testuser' });
	});

	it('should redirect to / on success login', async () => {
		await request(app)
			.post('/login')
			.send({ username: 'testuser', password: 'testpass' })
			.expect(302)
			.expect('Location', '/');
	});
});

describe('POST /login (WRONG credentials)', () => {
	before(async () => {
		await db
			.collection('users')
			.insertOne({ username: 'testuser', password: await bcrypt.hash('testpass', 10) });
	});
	after(async () => {
		await db.collection('users').deleteOne({ username: 'testuser' });
	});

	it('should redirect to /login on failed login', async () => {
		await request(app)
			.post('/login')
			.send({ username: 'testuser', password: 'wrongpass' })
			.expect(302)
			.expect('Location', '/login?notification=Username%20or%20password%20incorrect');
	});
});

describe('GET /wrong address', () => {
	it('should redirect to /404', async () => {
		const res = await request(app).get('/wrong');
		expect(res.status).to.equal(404);
		expect(res.text).to.include('<h1>404: Page Not Found</h1>');
	});
});

describe('POST /create (authenticated)', () => {
	it('should create survey and redirect to /', async () => {
		agent = request.agent(app);
		await db.collection('users').deleteMany({ username: 'testuser' });
		await db.collection('users').insertOne({
			username: 'testuser1',
			password: await bcrypt.hash('testpass', 10),
			surveys: []
		});
		await agent.post('/login').send({ username: 'testuser1', password: 'testpass' });
		const res = await agent.post('/create').send({
			title: 'Test survey',
			description: 'Test desc',
			private: 'on',
			questions: [
				{ text: 'Q1', answers: [{ text: 'A1' }, { text: 'A2' }] },
				{ text: 'Q2', answers: [{ text: 'A3' }, { text: 'A4' }] }
			]
		});
		const user = await db.collection('users').findOne({ username: 'testuser1' });

		expect(res.status).to.equal(302);
		expect(res.headers.location).to.equal('/');
		const survey = await db.collection('surveys').findOne({ title: 'Test survey' });
		expect(survey).to.exist;
		expect(survey.questions).to.have.length(2);
		expect(survey.createdBy.toString()).to.equal(user._id.toString());
	});
	afterEach(async () => {
		await db.collection('surveys').deleteMany({ title: 'Test survey' });
	});
});
