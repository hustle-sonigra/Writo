// idhar api-first ka use krke i want to enable the use of 
const form = document.getElementById("createBtn");
const container = document.getElementById("user-posts");    

form.addEventListener("submit",async (e)=>{
    e.preventDefault();
    window.location.href ="/create/post";
});

// load ke through i have to make sure ke saare joh mere khud ke posts hai they reach to me . 
// i want the access of all of mine posts here , thus is can view them

loadProfile();
async function loadProfile(){
    const res = await fetch("/api/v1/post/profile");
    const data = await res.json();
  container.innerHTML="";
  const header = document.createElement("p");
  header.innerHTML = `<h1>Welcome ${data.user.name}, to Writo </h1>
                      <h1> You can create, read, and share your thoughts through blogs.</h1>
  `;
 container.appendChild(header);
    data.user.posts.forEach(post=>{
        const div = document.createElement("div");
        div.innerHTML=
        `<h3>${post.postTittle}</h3>
         <p>${post.postData}</p>
         <p>${data.user.name}</p>
         <a href="/read/${post._id}">Read More</a>
         `;
         container.appendChild(div);
    })
}