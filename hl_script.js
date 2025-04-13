// Hospital Registration
const registrationForm = document.getElementById('hospitalRegistrationForm');
const hospitalList = document.getElementById('hospitalList');

let hospitals = JSON.parse(localStorage.getItem('hospitals')) || [];

if (registrationForm) {
    registrationForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const name = document.getElementById('name').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const contact = document.getElementById('contact').value;
        const services = document.getElementById('services').value
            .split(',')
            .map(service => service.trim())
            .filter(service => service !== '');

        // Get blood inventory data
        const bloodInventory = {
            'A+': parseInt(document.getElementById('blood_Apos').value) || 0,
            'A-': parseInt(document.getElementById('blood_Aneg').value) || 0,
            'B+': parseInt(document.getElementById('blood_Bpos').value) || 0,
            'B-': parseInt(document.getElementById('blood_Bneg').value) || 0,
            'AB+': parseInt(document.getElementById('blood_ABpos').value) || 0,
            'AB-': parseInt(document.getElementById('blood_ABneg').value) || 0,
            'O+': parseInt(document.getElementById('blood_Opos').value) || 0,
            'O-': parseInt(document.getElementById('blood_Oneg').value) || 0
        };

        const hospital = {
            id: Date.now(),
            username,
            password,
            name,
            address,
            city,
            state,
            contact,
            services,
            bloodInventory
        };

        hospitals.push(hospital);
        localStorage.setItem('hospitals', JSON.stringify(hospitals));
        displayHospitals();
        registrationForm.reset();
        alert('Hospital registered successfully!');
    });
}

function displayHospitals() {
    if (!hospitalList) return;
    
    hospitalList.innerHTML = '';

    if (hospitals.length === 0) {
        hospitalList.innerHTML = '<p>No hospitals registered yet.</p>';
        return;
    }

    hospitals.forEach(hospital => {
        const card = document.createElement('div');
        card.className = 'hospital-card';
        
        // Create blood inventory HTML if it exists
        let bloodInventoryHTML = '';
        if (hospital.bloodInventory) {
            bloodInventoryHTML = `
                <div class="blood-inventory" style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                    <h4 style="margin-bottom: 8px; color: #444;">Blood Inventory</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
                        ${Object.entries(hospital.bloodInventory).map(([type, units]) => `
                            <div style="background: ${type === 'O-' ? '#fee2e2' : '#f3f4f6'}; padding: 5px; border-radius: 4px; text-align: center; font-size: 14px;">
                                <span style="font-weight: bold; ${type === 'O-' ? 'color: #dc2626;' : ''}">${type}</span>: ${units} units
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        card.innerHTML = `
            <h3>${hospital.name}</h3>
            <p><strong>Address:</strong> ${hospital.address}, ${hospital.city}, ${hospital.state}</p>
            <p><strong>Contact:</strong> ${hospital.contact}</p>
            <div class="services-list">
                ${hospital.services.map(service => 
                    `<span class="service-tag">${service}</span>`
                ).join('')}
            </div>
            ${bloodInventoryHTML}
        `;
        hospitalList.appendChild(card);
    });
}

// Hospital Login
const loginForm = document.getElementById('hospitalLoginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Get hospitals from localStorage
        const hospitals = JSON.parse(localStorage.getItem('hospitals')) || [];
        
        // Find hospital with matching credentials
        const hospital = hospitals.find(h => h.username === username && h.password === password);
        
        if (hospital) {
            // Store the logged-in hospital's ID in sessionStorage
            sessionStorage.setItem('loggedInHospitalId', hospital.id);
            // Redirect to hospital.html
            window.location.href = 'hospital.html';
        } else {
            const errorMessage = document.getElementById('errorMessage');
            if (errorMessage) {
                errorMessage.style.display = 'block';
            } else {
                alert('Invalid username or password');
            }
        }
    });
}

// Display hospitals on page load if we're on the registration page
if (hospitalList) {
    displayHospitals();
}
