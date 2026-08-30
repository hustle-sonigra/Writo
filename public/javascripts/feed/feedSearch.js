// we have a search bar on the feed page , uski wprking and the event listener that we 
// attach will be on this file from here.
const container = document.getElementById("filteredPosts");
const params = new URLSearchParams(window.location.search);
const keyword = params.get("keyword");
loadFilteredContent(keyword);

async function loadFilteredContent(keyword){
    const res = await fetch("/api/v1/post/filtered",{
        method:"POST",
        headers : { "Content-Type": "application/json" },
        body : JSON.stringify({keyword})
    });
    const data = await res.json();
    if(!data.success)
    {
        return console.error("Error");
    }
    container.innerHTML = "";
    data.data.posts.forEach(post=>{
        const div = document.createElement("div");
        div.innerHTML=
        `<h3>${post.postTittle}</h3>
         <p>${post.postData}</p>
         <p>${post.user.name}</p>
         <a href="/read/${post._id}">Read More</a>
         `;
         container.appendChild(div);
    });
}





