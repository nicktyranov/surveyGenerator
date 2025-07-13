## Survey Constructor — FullStack JavaScript Project

### 📌 Description

Survey Constructor is a full-stack web application that enables authenticated users to create custom surveys, submit votes, and view real-time results with interactive charts.

The project is built using Node.js, Express.js, and MongoDB, with a server-side rendering interface using Handlebars.

---

### 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Handlebars, Chart.js
- **Database**: MongoDB (via Mongoose)
- **Testing**: Mocha, Chai, Supertest
- **Authentication**: Session-based login system (express-session)

---

### ⚙️ Installation & Run

```bash
git clone https://github.com/nicktyranov/surveyGenerator.git
cd surveyGenerator
npm install
npm start
```

---

### 📁 Project Structure

```
surveyGenerator/
├── public/
├── routes/
├── views/
├── models/
├── test/
├── app.js
├── package.json
└── README.md
```

---

### 🔄 Main Routes

| Method | Path          | Description                      |
| ------ | ------------- | -------------------------------- |
| GET    | `/`           | Home page with a list of surveys |
| GET    | `/create`     | Survey creation form             |
| POST   | `/create`     | Handles survey creation          |
| GET    | `/survey/:id` | Displays specific survey         |
| POST   | `/vote/:id`   | Submits vote for a survey        |

---

### 🧩 Key Features

- User authentication with session support
- Survey creation with multiple questions and answers
- Public/private survey visibility
- Result visualization with Chart.js
- Server-side validation and error handling

---

### 🧪 Testing Coverage

The project is covered with both unit and integration tests using:

- **Mocha & Chai** for assertion
- **Supertest** for HTTP endpoint testing

Tested flows include:

- User registration and login
- Access control for protected routes
- Survey creation and vote submission
- Error handling (duplicate users, unauthenticated access)

---

### 🧾 License

MIT License

---

### 👤 Author

Nick Tyranov — FullStack JavaScript Developer (IBM Certified, 2025)
