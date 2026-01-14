// now this is the first time this file or folder gets into proper use . 
// iss particular file pe if we have any updation or logic to be implemented 
// and if we want to do it without the page reloading and the stuff to be dynamic 
// this sort of makes me understand that yes this is where i can put in that logic and cater linking 
// my ejs files here . its like an html file on steroids , thus the advantage that we have here 
// html mai jaise we used to link some css and additionally some js with the file , this is what we are doing rihht now.

// . is for a class and we have # for the use of an id 
// itna clear hai na. 

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".like-section").forEach(section => {
    const btn = section.querySelector(".like-btn");  // button
    const icon = btn.querySelector("i"); // icon 
    const countSpan = section.querySelector(".like-count");

    let liked = section.dataset.liked === "true"; // for boolean conversion

    btn.addEventListener("click",()=>{
        let count = parseInt(countSpan.innerText);
        liked = !liked ; // as the button is clicked thus pehle joh bhi that abb uska ultha ho chuka hai 
        
        icon.classList.toggle("fa-solid",liked);// true , boolean
        icon.classList.toggle("fa-regular",!liked); // FALSE

        countSpan.innerText = liked ? count+1 : count-1;
    });  
});
});

// ab aisa hai ke toggle krne i have to set up ke ya toh like ho rhaa hai ya toh dislike ho rhaa hai 
// we dont want to just keep likikng the same post multiple times

// also abhi main joh like krr rhaa hu , it doesnt stay . What could be the reason behind it . 
// now lets see that . Uske baare mai hi toh mai intrested hu . 
// its like maine like kra and it sort of stays there forever . 

// i have solved the ui error 
// i have also solved the one user one like error
// abb dusri baar click krne pe it will toggle 
// this means that we will end up having the one like per user and proper ui is also displayed in place to visually feel the aspect of the user liking my post 

// next big task up my hand is the process of setting up , the likes being stored and also stay with the web page reloading though!




