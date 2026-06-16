async function test() {
  const fileContent = Buffer.from('dummy image content');
  const blob = new Blob([fileContent], { type: 'image/png' });
  const formData = new FormData();
  formData.append('image', blob, 'test.png');

  console.log('Sending upload request to http://localhost:5000/api/upload ...');
  try {
    const res = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      body: formData
    });
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('JSON Response:', json);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

test();
