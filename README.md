<h1 align="center">
   Writo – A Full-Stack Blogging Platform
  <p>
    
  </p
  <p align="center">
  <a href="https://skillicons.dev">
    <img src="https://skillicons.dev/icons?i=mongodb,express,npm,nodejs,javascript" />
  </a>
</p>
</h1>
Writo is a backend-driven blogging platform built to practice real-world concepts like authentication middleware, MVC architecture, and database relationships.

🔗 **Live Demo:** [https://writo-l1yl.onrender.com](https://writo-l1yl.onrender.com)
<br>
📂 **Source Code:** [https://github.com/hustle-sonigra/Writo](https://github.com/hustle-sonigra/Writo)

---
## Why Writo❔
This project was built to understand:

* How JWT authentication works end-to-end

* How middleware protects routes

* How data flows in an MVC-based Express app

* How MongoDB relations (users ↔ posts ↔ likes) are handled
  
* Curiosity led project to execute and understand 
---

## 🚀 Features

* User authentication using JWT and tokens
* Create, edit, and delete blog posts
* Liking system with real-time count and updations
* Search blogs by keyword
* Filtered result on base of String Matching
* Role-based access (only authors can edit their posts) , proper Authorisation
* Responsive and minimal UI 

---

## 🛠 Tech Stack

* **Backend:** Node.js, Express.js
* **Frontend:** EJS, CSS
* **Database:** MongoDB (Mongoose)
* **Authentication:** JWT, Middleware
* **Deployment:** Render

---

## 🧠 Application Flow

1. User signs up / logs in
2. JWT is issued
3. Verification via middleware
4. Allotment of a token to remember the User
5. Authenticated users can create and manage posts
6. Posts are stored in MongoDB and rendered via EJS
7. Likes are also stores in the database
8. Search filters posts efficiently on request
9. Responsive feed displaying all the posts uploaded
10. Reading and liking of each post can be also  done

---

## 📸 Screenshots
Page that pops after a login . This is the first feed page on the web-app.
<img width="1895" height="940" alt="Screenshot 2026-01-18 215014" src="https://github.com/user-attachments/assets/0ada61ef-086f-475e-a9fa-bbbec8ce8d3d" />

Individual full-screen read of the blog , with the list of liked users being displayed on hover
<img width="1895" height="944" alt="Screenshot 2026-01-18 215202" src="https://github.com/user-attachments/assets/56a8b620-eee5-4196-a98f-81c6594e1f0c" />

Search bar in place
<img width="1895" height="942" alt="Screenshot 2026-01-18 215103" src="https://github.com/user-attachments/assets/739b3425-737d-4fc6-81a5-ba881a7b704a" />
---

## ⚙️ Run Locally

```bash
git clone https://github.com/hustle-sonigra/Writo
cd Writo
npm install
npm start
```

Create a `.env` file and add:

```
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret_key
```

---
## Architecture

* Controllers handle business logic

* Routes map HTTP requests

* Models define MongoDB schemas

* Middleware validates authentication
---
## 🔮 Future Enhancements

* Comment system to make it feel completed
* Pagination for feed(responsive user redirection , enhanced navigation)
* Full-text MongoDB search(better latency and searching outputs)
* User profile analytics
* Custom feed placement for each user
* Better UI for seamless usage
* Open to curiosity and play-around

---

## 👤 Author

**Taksh Sonigra**
