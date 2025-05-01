// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(
    'https://caevromriepgcvswpxxs.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhZXZyb21yaWVwZ2N2c3dweHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4ODYwMjEsImV4cCI6MjA2MTQ2MjAyMX0.OmnPwkSrv0UTjgwcZIbiamdVcw76tfh2uGh11O-6AhQ'
);

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date inputs with today's date as minimum
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('checkIn')) {
        document.getElementById('checkIn').min = today;
        document.getElementById('checkOut').min = today;
    }

    // Room prices configuration
    const roomPrices = {
        'deluxe': 300,
        'executive': 500,
        'presidential': 1000
    };

    const addonPrices = {
        'airport-pickup': 50,
        'breakfast': 30,
        'spa': 100
    };

    // Handle room type selection from URL parameters (for booking.html)
    const urlParams = new URLSearchParams(window.location.search);
    const roomType = urlParams.get('room');
    if (roomType && document.getElementById('roomType')) {
        document.getElementById('roomType').value = roomType;
        calculateTotalPrice();
    }

    // Price calculation function
    function calculateTotalPrice() {
        const roomTypeSelect = document.getElementById('roomType');
        const checkInInput = document.getElementById('checkIn');
        const checkOutInput = document.getElementById('checkOut');
        const priceDetails = document.querySelector('.price-details');

        if (!roomTypeSelect || !checkInInput || !checkOutInput || !priceDetails) return;

        const roomType = roomTypeSelect.value;
        const checkIn = new Date(checkInInput.value);
        const checkOut = new Date(checkOutInput.value);

        if (!roomType || !checkIn || !checkOut) return;

        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        if (nights <= 0) return;

        const roomPrice = roomPrices[roomType];
        const roomTotal = roomPrice * nights;

        // Calculate addons
        let addonsTotal = 0;
        document.querySelectorAll('input[name="addons"]:checked').forEach(addon => {
            if (addon.value === 'breakfast') {
                addonsTotal += addonPrices[addon.value] * nights;
            } else {
                addonsTotal += addonPrices[addon.value];
            }
        });

        const total = roomTotal + addonsTotal;

        // Update price summary
        priceDetails.innerHTML = `
            <div><span>Room Rate:</span> <span>$${roomPrice} × ${nights} nights = $${roomTotal}</span></div>
            ${addonsTotal > 0 ? `<div><span>Additional Services:</span> <span>$${addonsTotal}</span></div>` : ''}
            <div style="font-weight: bold; margin-top: 10px;"><span>Total:</span> <span>$${total}</span></div>
        `;
    }

    // Event listeners for price calculation
    if (document.getElementById('reservationForm')) {
        ['roomType', 'checkIn', 'checkOut'].forEach(id => {
            document.getElementById(id).addEventListener('change', calculateTotalPrice);
        });

        document.querySelectorAll('input[name="addons"]').forEach(addon => {
            addon.addEventListener('change', calculateTotalPrice);
        });

        // Check-in/out date validation
        document.getElementById('checkIn').addEventListener('change', function() {
            const checkOut = document.getElementById('checkOut');
            checkOut.min = this.value;
            if (checkOut.value && checkOut.value < this.value) {
                checkOut.value = this.value;
            }
            calculateTotalPrice();
        });
    }

    // Handle reservation form submission
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('.submit-button');
            submitButton.classList.add('loading');
            submitButton.disabled = true;

            // Gather form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                check_in: document.getElementById('checkIn').value,
                check_out: document.getElementById('checkOut').value,
                adults: document.getElementById('adults').value,
                children: document.getElementById('children').value,
                room_type: document.getElementById('roomType').value,
                preferences: Array.from(document.querySelectorAll('input[name="preferences"]:checked'))
                    .map(pref => pref.value),
                addons: Array.from(document.querySelectorAll('input[name="addons"]:checked'))
                    .map(addon => addon.value),
                special_requests: document.getElementById('special-requests').value,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            try {
                const { data, error } = await supabaseClient
                    .from('reservations')
                    .insert([formData]);

                if (error) throw error;

                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-message';
                successMessage.style.display = 'block';
                successMessage.textContent = 'Reservation submitted successfully! We will send you a confirmation email shortly.';
                reservationForm.insertBefore(successMessage, reservationForm.firstChild);

                // Reset form
                reservationForm.reset();
                document.querySelector('.price-details').innerHTML = '';

                // Scroll to success message
                successMessage.scrollIntoView({ behavior: 'smooth' });

                // Remove success message after 5 seconds
                setTimeout(() => {
                    successMessage.remove();
                }, 5000);

            } catch (error) {
                console.error('Error:', error);
                alert('There was an error submitting your reservation. Please try again.');
            } finally {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        });
    }

    // Handle contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = {
                name: this.querySelector('input[type="text"]').value,
                email: this.querySelector('input[type="email"]').value,
                message: this.querySelector('textarea').value,
                created_at: new Date().toISOString()
            };

            try {
                const { data, error } = await supabaseClient
                    .from('contact_messages')
                    .insert([formData]);

                if (error) throw error;

                alert('Message sent successfully! We will get back to you soon.');
                this.reset();
            } catch (error) {
                console.error('Error:', error);
                alert('There was an error sending your message. Please try again.');
            }
        });
    }

    // Gallery image loading (for index.html)
    const galleryGrid = document.querySelector('.gallery-grid');
    if (galleryGrid) {
        const galleryImages = [
            { src: 'images/gallery-1.jpg', alt: 'Hotel Exterior' },
            { src: 'images/gallery-2.jpg', alt: 'Lobby' },
            { src: 'images/gallery-3.jpg', alt: 'Pool' },
            { src: 'images/gallery-4.jpg', alt: 'Restaurant' },
            { src: 'images/gallery-5.jpg', alt: 'Spa' },
            { src: 'images/gallery-6.jpg', alt: 'Room Interior' }
        ];

        galleryImages.forEach(image => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;
            galleryGrid.appendChild(galleryItem);
        });
    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple Mobile Menu Toggle
    const menuButton = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuButton && navLinks) {
        menuButton.addEventListener('click', function() {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', function() {
                menuButton.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuButton.contains(e.target) && !navLinks.contains(e.target)) {
                menuButton.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
});