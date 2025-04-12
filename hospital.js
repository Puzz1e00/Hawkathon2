document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const hospitalId = sessionStorage.getItem('loggedInHospitalId');
    if (!hospitalId) {
        window.location.href = 'index.html';
        return;
    }

    // Get hospital details
    const hospitals = JSON.parse(localStorage.getItem('hospitals')) || [];
    const hospital = hospitals.find(h => h.id === hospitalId);

    if (hospital) {
        // Display hospital information
        const hospitalDetails = document.getElementById('hospitalDetails');
        hospitalDetails.innerHTML = `
            <p><strong>Name:</strong> ${hospital.name}</p>
            <p><strong>Address:</strong> ${hospital.address}</p>
            <p><strong>Contact:</strong> ${hospital.contact}</p>
            <p><strong>Services:</strong> ${hospital.services.join(', ')}</p>
        `;
    }

    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('loggedInHospitalId');
            window.location.href = 'index.html';
        });
    }
}); 