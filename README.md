## Survey Constructor — FullStack JavaScript Project

### 📌 Description

"Survey Constructor" is a web application that allows users to create surveys, vote, and view the results in chart format.

The project is built using Node.js, Express.js, and MongoDB, with a server-side rendering interface using Handlebars.

---

### 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Handlebars, Chart.js
- **Database**: MongoDB (via Mongoose)
- **Testing**: Mocha, Chai, Supertest

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

### 🧾 License

MIT License

---

### 👤 Author

Nick Tyranov — FullStack JavaScript Developer (IBM Certified, 2025)
