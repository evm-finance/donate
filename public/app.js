// Select form and result display
const form = document.getElementById('addressForm');
const resultPara = document.getElementById('result');

// Add submit event listener
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevent page reload

    // Get user input
    const userInput = document.getElementById('userInput').value;

    // Send GET request with query parameter
    fetch(`/api/echo?text=${encodeURIComponent(userInput)}`)
        .then(response => response.json())
        .then(data => {
            // Display the response
            resultPara.textContent = `Server says: ${data.message}`;
        })
        .catch(err => {
            console.error('Error:', err);
            resultPara.textContent = 'Error sending request.';
        });
});
