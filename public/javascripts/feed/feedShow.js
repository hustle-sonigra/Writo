
// first visit of the entire feed that we have here , that is what is useful 
// we have the entire feed to be displayed where we cater this logic by getting in the entire 
// postdata as the from the fetch section and we display by loopinf a forEach on it.
  async function loadFeed() {
    const res = await fetch("/api/v1/auth/feed");
    const data = await res.json();

    const container = document.getElementById("feed");
    const l = data.data.posts.length;

    // this displays the entire feed as it is . 
    // no ups and downs with this joh hai woh hi dikhega. 
    // data.data.posts.forEach(post => {
    //   const div = document.createElement("div");
    //   div.innerHTML = `
    //     <h3>${post.postTittle}</h3>
    //     <p>${post.postData.substring(0,100)}</p>
    //     <p>By: ${post.user.name}</p>
    //     <a href="/read/${post._id}">Read More</a>
    //   `;
    //   container.appendChild(div);
    // }); 

    // now lets try and make this entirely ulta
    for( i=l-1;i>=0;i--)
    {
      const post = data.data.posts[i];
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${post.postTittle}</h3>
        <p>${post.postData.substring(0,100)}</p>
        <p>By: ${post.user.name}</p>
        <a href="/read/${post._id}">Read More</a>
      `;
      container.appendChild(div);
    }; 
    }
  loadFeed();