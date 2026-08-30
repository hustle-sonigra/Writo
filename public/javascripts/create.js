const form = document.getElementById("submitBtn");

form.addEventListener("submit",async(e)=>{
    e.preventDefault();

    const postData = form.postData.value;
    const postTittle = form.postTittle.value;
    console.log(postData);
    console.log(postTittle);

    const res = await fetch("/api/v1/post/feedNewPost",{
        method:"POST",
        headers:{ "Content-Type": "application/json"},
        body:JSON.stringify({postData,postTittle})
    });
    // first issue is here , i am not getting back the dedicated response from the backend 
    // aur agar yaha pe issue aa chuka hai that means i am going to struggle to get an output later on . 
    // the crucuial higlight is to now debug myself ke bhai answer kaha fuss rhaa hai mera. 
    const data = await res.json();
    window.location.href = "/feed";
});

// i have to yes add a event listener to the submit button 
// i have to send the data to the backend 
// the main agenda is to you know what you want to do with your data 
// proper method , header , body --> yeh teeno proper likhn padege cause u have to send data at the back . 
// now the plus point for me is that yeh same process maine pehle kia hua hai toh i know how the things are going to be working 
// lets make a function that is sending this data back to the backend and at the end i am just changing the 
// loactions of this post through the window.loaction waala command and then lets see what happens at that point and i am basically 
// intrested in that so i hope it is going to be good for me agar pura mai khud se likh pau.

