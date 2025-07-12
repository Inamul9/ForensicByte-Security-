// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initAnimations();
    initMobileMenu();
    initSmoothScrolling();
    initThemeToggle();
    initSectionReveal();
    initKeyboardNavigation();
    initButtonEffects();
    initScrollProgress();
    initCommandCopy();
    initParallax();
    addLoadingAnimation();
    initLoadingScreen();
    initContactForm();
    initUptimeSystem();
});

// Navigation functionality
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Add scroll-based navbar effects
    let lastScrollTop = 0;
    let scrollTimeout;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class when user scrolls down
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide navbar on scroll down, show on scroll up (optional effect)
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - hide navbar
            navbar.style.transform = 'translateX(-50%) translateY(-100px)';
        } else {
            // Scrolling up - show navbar
            navbar.style.transform = scrollTop > 50 ? 
                'translateX(-50%) scale(0.98)' : 
                'translateX(-50%)';
        }

        lastScrollTop = scrollTop;

        // Clear timeout and reset navbar position after scrolling stops
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (scrollTop > 50) {
                navbar.style.transform = 'translateX(-50%) scale(0.98)';
            } else {
                navbar.style.transform = 'translateX(-50%)';
            }
        }, 150);
    });

    // Add active state to nav links based on current section
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');

    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            
            if (navMenu) {
                navMenu.classList.toggle('active');
            }
            if (dashboardSidebar) {
                dashboardSidebar.classList.toggle('active');
            }
        });
    }

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (hamburger && !hamburger.contains(e.target)) {
            if (navMenu && !navMenu.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            }
            if (dashboardSidebar && !dashboardSidebar.contains(e.target)) {
                 hamburger.classList.remove('active');
                dashboardSidebar.classList.remove('active');
            }
        }
    });

    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger) hamburger.classList.remove('active');
            if (navMenu) navMenu.classList.remove('active');
        });
    });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animate elements on scroll
function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.feature-card, .command-card, .stat-card, .hero-content');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });
}

// Add the new Uptime System
function initUptimeSystem() {
    const services = [
        { id: 1, baseResponse: 290, el: document.querySelector('#uptime-1')?.closest('.status-card') },
        { id: 2, baseResponse: 510, el: document.querySelector('#uptime-2')?.closest('.status-card') },
        { id: 3, baseResponse: 72, el: document.querySelector('#uptime-3')?.closest('.status-card') }
    ];

    // Initial population of history bars
    services.forEach(service => {
        if (!service.el) return;
        const historyContainer = service.el.querySelector('.status-history');
        for (let i = 0; i < 90; i++) {
            const bar = document.createElement('div');
            bar.className = Math.random() < 0.03 ? 'history-bar down' : 'history-bar';
            historyContainer.appendChild(bar);
        }
    });

    const updateData = () => {
        services.forEach(service => {
            if (!service.el) return;

            const uptimeEl = service.el.querySelector('.metric-value');
            const responseEl = service.el.querySelectorAll('.metric-value')[1];
            const statusIndicatorEl = service.el.querySelector('.status-indicator');
            const statusTagEl = service.el.querySelector('.status-tag');
            const historyContainer = service.el.querySelector('.status-history');
            const progressBar = service.el.querySelector('.bar-progress');

            // Generate fake data
            const isOnline = Math.random() > 0.05; // 95% chance to be online
            const uptime = isOnline ? (100 - Math.random() * 0.02).toFixed(2) : (98 + Math.random()).toFixed(2);
            const response = isOnline ? Math.floor(service.baseResponse + (Math.random() - 0.5) * 50) : 0;
            
            // Update UI
            uptimeEl.textContent = `${uptime}%`;
            responseEl.textContent = isOnline ? `${response}ms` : '-';
            progressBar.style.width = `${uptime}%`;
            
            statusIndicatorEl.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
            statusTagEl.className = `status-tag ${isOnline ? 'online' : 'offline'}`;
            statusTagEl.textContent = isOnline ? 'Online' : 'Offline';

            // Cycle history bars
            if (historyContainer.firstChild) {
                historyContainer.removeChild(historyContainer.firstChild);
            }
            const newBar = document.createElement('div');
            newBar.className = isOnline ? 'history-bar' : 'history-bar down';
            historyContainer.appendChild(newBar);
        });
    };

    updateData(); // Initial call
    setInterval(updateData, 3000); // Update every 3 seconds
}

// Add loading animation to page elements
function addLoadingAnimation() {
    const elements = document.querySelectorAll('.feature-card, .command-card, .stat-card');
    elements.forEach((el, index) => {
        el.style.animationDelay = `${index * 0.1}s`;
    });
}

// Parallax effect for hero section
function initParallax() {
    if (window.innerWidth <= 768) return;
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const hero = document.querySelector('.hero');
        const botAvatar = document.querySelector('.bot-avatar');
        
        if (hero && botAvatar) {
            const rate = scrolled * -0.2;
            botAvatar.style.transform = `translateY(${rate}px) translateZ(0)`;
        }
    });
}

// Initialize parallax on larger screens
if (window.innerWidth > 768) {
    initParallax();
}

// Add hover effects to buttons
function initButtonEffects() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', function(e) {
            const x = e.pageX - this.offsetLeft;
            const y = e.pageY - this.offsetTop;
            
            this.style.setProperty('--x', `${x}px`);
            this.style.setProperty('--y', `${y}px`);
        });
    });
}

// Add scroll progress indicator
function initScrollProgress() {
    const scrollProgress = document.createElement('div');
    scrollProgress.className = 'scroll-progress';
    document.body.prepend(scrollProgress);

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = `${scrollPercent}%`;
    });
}

// Add copy functionality for command examples
function initCommandCopy() {
    const commandCards = document.querySelectorAll('.command-card');
    
    commandCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
            const command = this.querySelector('.command-header span').textContent;
            navigator.clipboard.writeText(command).then(() => {
                // Show copy feedback
                const originalText = this.querySelector('p').textContent;
                this.querySelector('p').textContent = 'Command copied!';
                this.style.borderColor = 'var(--success-color)';
                
                setTimeout(() => {
                    this.querySelector('p').textContent = originalText;
                    this.style.borderColor = 'var(--border-color)';
                }, 2000);
            });
        });
    });
}

// Add theme toggle functionality (for future dark mode)
function initThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    document.body.appendChild(themeToggle);

    const body = document.body;
    const sunIcon = '<i class="fas fa-sun"></i>';
    const moonIcon = '<i class="fas fa-moon"></i>';

    const applyTheme = (theme) => {
        if (theme === 'light') {
            body.classList.add('light-theme');
            themeToggle.innerHTML = moonIcon;
        } else {
            body.classList.remove('light-theme');
            themeToggle.innerHTML = sunIcon;
        }
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
        const newTheme = body.classList.contains('light-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}

// Add loading screen
function initLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--background-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease;
    `;
    
    loadingScreen.innerHTML = `
        <div style="text-align: center; color: var(--text-primary);">
            <i class="fas fa-robot" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0; animation: fadeIn 1s ease-in-out forwards;"></i>
            <h2 style="margin-bottom: 1rem; opacity: 0; animation: fadeIn 1s ease-in-out 0.3s forwards;">ForensicByte | Security™X</h2>
            <p style="opacity: 0; animation: fadeIn 1s ease-in-out 0.6s forwards;">Loading amazing features...</p>
        </div>
    `;
    
    // Add fadeIn animation style
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(loadingScreen);
    
    // Remove loading screen after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 500);
    });
}

// Add keyboard navigation support
function initKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Escape key to close mobile menu
        if (e.key === 'Escape') {
            const hamburger = document.querySelector('.hamburger.active');
            if (hamburger) {
                hamburger.click();
            }
        }
    });
}

// Add smooth reveal animations for sections
function initSectionReveal() {
    const sections = document.querySelectorAll('section');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        sectionObserver.observe(section);
    });
}

// Contact Form Handling
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(contactForm);
            const name = formData.get('name');
            const email = formData.get('email');
            const subject = formData.get('subject');
            const message = formData.get('message');
            
            // Basic validation
            if (!name || !email || !subject || !message) {
                showNotification('Please fill in all fields', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                showNotification('Thank you! Your message has been sent successfully. We\'ll get back to you soon!', 'success');
                contactForm.reset();
                
                // Reset button
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}
