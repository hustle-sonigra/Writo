
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value;
    const password = form.password.value;

    // idhar return mai aa rhe hai saare ke saare posts , 
    // we do not need them here . 
    // FACT : yaha  se joh hum important cheeze hai that we want to use in the backend 
    // we can send them through the body tag here. 
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
   
    const data = await res.json();
    if (!data.success) {
      alert(data.message);
      return;
    }
    window.location.href = "/feed";
  });

