async function test() {
  try {
    console.log("Fetching active banners from backend API (http://localhost:5000/api/banners/active)...");
    const response = await fetch("http://localhost:5000/api/banners/active");
    console.log("Response Status:", response.status);
    
    const data = await response.json();
    console.log("Success:", data.success);
    console.log("Banners returned:", data.data?.length);
    
    if (data.data) {
      data.data.forEach((b) => {
        console.log(`- Title: "${b.title}", Position: "${b.position}", Image: "${b.imageUrl}"`);
      });
    }
  } catch (error) {
    console.error("Error calling backend API:", error.message);
  }
}

test();
