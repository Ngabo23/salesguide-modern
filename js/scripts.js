// Global data storage
const userData = {
    personal: {},
    requirements: {
        terms: false,
        money: false,
        paymentMethod: null
    },
    payment: {
        consultation: false,
        code: null,
        date: null
    },
    role: {
        selected: null,
        price: null,
        date: null
    },
    timeline: {
        registration: null,
        payment: null,
        roleSelection: null
    }
};

// Current step management
let currentStep = 1;
let currentTourCard = 1;
let paymentConfirmed = false;

// Section index within each top-level page (only one .step-content visible at a time)
const pageSectionIndex = { 1: 0, 2: 0, 3: 0 };

// 3-page flow:
// Page 1 => step 1 (requirements + continuation)
// Page 2 => single view: 2.1 + 2.2 (tour) + 2.3 video + 2.3.2 consultation (all in #step3)
// Page 3 => step 6 (services & tiers)
const groupedSteps = {
    1: [1],
    2: [3],
    3: [6]
};

function getPageSectionIndex(page) {
    return pageSectionIndex[page] ?? 0;
}

function normalizeStepNumber(stepNumber) {
    if (groupedSteps[stepNumber]) return stepNumber;
    if (stepNumber === 4 || stepNumber === 5) return 2;
    if (stepNumber >= 6) return 3;
    return 1;
}

/* ==========================================================================
   Modern Theme & Lightbox Management
   ========================================================================== */
function initModernTheme() {
    const savedTheme = localStorage.getItem('salesguide_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleUI(savedTheme);
}

function toggleModernTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('salesguide_theme', nextTheme);
    updateThemeToggleUI(nextTheme);
    showNotification(`Switched to Modern ${nextTheme.charAt(0).toUpperCase() + nextTheme.slice(1)} Mode`, 'info');
}

function updateThemeToggleUI(theme) {
    const btn = document.getElementById('themeSwitchBtn');
    if (!btn) return;
    if (theme === 'dark') {
        btn.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
        btn.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
        btn.innerHTML = '<i class="fas fa-moon"></i> <span>Modern Dark</span>';
        btn.setAttribute('aria-label', 'Switch to Modern Dark Mode');
    }
}

// Lightbox modal handler
function openLightbox(src) {
    const lightbox = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    if (lightbox && img) {
        img.src = src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const lightbox = document.getElementById('lightboxModal');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`${label || 'Text'} copied to clipboard!`, 'success');
        }).catch(() => {
            fallbackCopyText(text, label);
        });
    } else {
        fallbackCopyText(text, label);
    }
}

function fallbackCopyText(text, label) {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showNotification(`${label || 'Text'} copied!`, 'success');
}

/* ==========================================================================
   Page 1 Initialization & Controls
   ========================================================================== */
function initStep1A1() {
    // Single checkbox -> show/hide all document previews if element exists
    const toggleAll = document.getElementById('doc_show_all');
    const docPreviews = [
        document.getElementById('docPreview_id'),
        document.getElementById('docPreview_passport'),
        document.getElementById('docPreview_permit')
    ].filter(Boolean);

    function setAllDocPreviews(visible) {
        docPreviews.forEach(el => {
            el.style.display = visible ? 'block' : 'none';
        });
    }

    if (toggleAll) {
        toggleAll.addEventListener('change', () => {
            setAllDocPreviews(toggleAll.checked);
        });
        setAllDocPreviews(toggleAll.checked);
    }

    // A.1.3 (yego/oya) + follow-up
    const yego = document.getElementById('a13_yego');
    const oya = document.getElementById('a13_oya');
    const followup = document.getElementById('a13_followup');

    function setFollowupVisible(show) {
        if (!followup) return;
        followup.style.display = show ? 'block' : 'none';
        if (!show) {
            followup.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
        }
    }

    function updateA13() {
        if (yego && yego.checked) {
            if (oya) oya.checked = false;
            setFollowupVisible(false);
            return;
        }
        if (oya && oya.checked) {
            if (yego) yego.checked = false;
            setFollowupVisible(true);
            return;
        }
        setFollowupVisible(false);
    }

    if (yego) yego.addEventListener('change', updateA13);
    if (oya) oya.addEventListener('change', updateA13);

    updateA13();
}

// Video play functionality with GitHub fallback for offline/local compatibility
function playVideo(element, videoUrl) {
    const container = element.closest('.video-container');
    const preview = container.querySelector('.video-preview');
    
    if (preview) {
        preview.style.display = 'none';
    }
    element.style.display = 'none';
    
    const existingVideo = container.querySelector('video:not(.video-preview)');
    if (existingVideo) {
        existingVideo.style.display = 'block';
        existingVideo.play();
        return;
    }
    
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.position = "absolute";
    video.style.top = "0";
    video.style.left = "0";
    video.style.objectFit = "contain";
    video.style.zIndex = "3";
    
    // Primary local source
    const sourceLocal = document.createElement('source');
    sourceLocal.src = videoUrl;
    sourceLocal.type = "video/mp4";
    video.appendChild(sourceLocal);

    // Online fallback source
    const sourceOnline = document.createElement('source');
    sourceOnline.src = "https://raw.githubusercontent.com/buysellorrent1/salesguide/main/" + videoUrl;
    sourceOnline.type = "video/mp4";
    video.appendChild(sourceOnline);
    
    video.addEventListener('error', function(e) {
        console.error('Video error:', e);
    });
    
    container.appendChild(video);
    
    video.play().catch(function(error) {
        console.log('Video play interrupted or muted autoplay policy:', error);
    });
}

// Initialize video previews at 2 seconds
function initializeVideoPreviews() {
    const videoPreviews = document.querySelectorAll('.video-preview');
    
    videoPreviews.forEach(video => {
        video.addEventListener('loadedmetadata', function() {
            if (this.duration >= 2) {
                this.currentTime = 2;
            } else if (this.duration > 0) {
                this.currentTime = this.duration / 2;
            }
        });
        
        video.addEventListener('seeked', function() {
            this.style.opacity = '1';
            this.style.display = 'block';
        });
        
        video.addEventListener('error', function(e) {
            this.style.display = 'none';
        });
        
        video.load();
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initModernTheme();
    initializeProgressBar();
    initializeVideoPreviews();
    loadUserData();
    updateTourCounter();

    // Attach lightbox triggers to all document and illustration images
    document.querySelectorAll('.doc-preview-card img, .roles-illustration, .section-illustration img, .tour-card-image img').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.src));
        img.title = 'Click to inspect full image';
    });

    // Close lightbox on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    userData.timeline.registration = new Date().toLocaleString();
    
    const savedData = localStorage.getItem('userRegistrationData');
    if (savedData) {
        Object.assign(userData, JSON.parse(savedData));
        updateUIFromData();
    }

    // ensure no role card shows the selection frame on initial load
    document.querySelectorAll('.role-card.selected').forEach(el => el.classList.remove('selected', 'pulse'));

    const regForm = document.getElementById('registrationForm');
    if (regForm) {
        regForm.addEventListener('submit', function(e) { e.preventDefault(); });
        regForm.addEventListener('keydown', function(e) { if (e.key === 'Enter') e.preventDefault(); });
    }

    renderPaymentDetails();

    const landingContinuation = document.getElementById('landingContinuation');
    const step2El = document.getElementById('step2');
    if (landingContinuation && step2El) {
        step2El.classList.remove('step-content');
        step2El.style.display = 'block';
        landingContinuation.appendChild(step2El);
    }

    mergeStep4IntoStep3();

    currentStep = 1;
    goToStep(1, 0);
});

// Progress bar functions
function initializeProgressBar() {
    const steps = document.querySelectorAll('.step');
    
    steps.forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.getAttribute('data-step'), 10);
            goToStep(stepNumber, 0);
        });
    });
    
    updateProgressBar();
}

function updateProgressBar() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.className = 'progress-bar';
        progressBar.classList.add(`step${currentStep}`);
    }
    
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

// Step navigation functions
function nextStep(step) {
    const target = normalizeStepNumber(step);
    if (target === currentStep) {
        nextPageSection();
        return;
    }
    if (validateCurrentStep()) {
        goToStep(target, 0);
    }
}

function prevStep(step) {
    const target = normalizeStepNumber(step);
    if (target === currentStep) {
        prevPageSection();
        return;
    }
    goToStep(target, 0);
}

function validatePageSection(page, sectionIdx) {
    if (page === 1 && sectionIdx >= 1) {
        return validateRequirements();
    }
    return true;
}

function nextPageSection() {
    const pageSteps = groupedSteps[currentStep] || [];
    const idx = getPageSectionIndex(currentStep);

    if (idx < pageSteps.length - 1) {
        if (!validatePageSection(currentStep, idx)) return;
        goToStep(currentStep, idx + 1);
        return;
    }

    if (!validatePageSection(currentStep, idx)) return;
    const nextPage = currentStep + 1;
    if (groupedSteps[nextPage]) {
        goToStep(nextPage, 0);
    }
}

function prevPageSection() {
    const idx = getPageSectionIndex(currentStep);
    if (idx > 0) {
        goToStep(currentStep, idx - 1);
        return;
    }
    if (currentStep > 1) {
        const prevPage = currentStep - 1;
        const prevSections = groupedSteps[prevPage] || [];
        goToStep(prevPage, Math.max(0, prevSections.length - 1));
    }
}

function goToStep(stepNumber, sectionIndex) {
    const normalizedStep = normalizeStepNumber(stepNumber);
    const pageSteps = groupedSteps[normalizedStep] || [];
    if (!pageSteps.length) return;

    let sec = sectionIndex;
    if (sec === undefined || sec === null) {
        sec = getPageSectionIndex(normalizedStep);
    }
    sec = Math.max(0, Math.min(sec, pageSteps.length - 1));

    document.querySelectorAll('.step-content').forEach(step => {
        step.classList.remove('active');
    });

    const stepElement = document.getElementById(`step${pageSteps[sec]}`);
    if (!stepElement) return;

    stepElement.classList.add('active');
    pageSectionIndex[normalizedStep] = sec;
    currentStep = normalizedStep;
    updateProgressBar();

    if (normalizedStep === 1) {
        initStep1A1();
        initializeRequirements();
    }

    if (normalizedStep === 2) {
        ensureStep2MarketContentVisible();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Step 2 is one scrollable page: 2.1, 2.2, video, consultation — keep all blocks visible. */
function ensureStep2MarketContentVisible() {
    ['step41Section', 'step43Section'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    });
    const req4 = document.getElementById('reqCard4');
    if (req4) req4.classList.add('active');
}

/** Legacy onclick handlers: no longer hide sibling sections. */
function showStep41Table() {
    ensureStep2MarketContentVisible();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStep42Video() {
    ensureStep2MarketContentVisible();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showStep43Consultation() {
    ensureStep2MarketContentVisible();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/** Move #step4 blocks into #step3 (2.1 footer) so progress step 2 is one DOM page. */
function mergeStep4IntoStep3() {
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    if (!step3 || !step4) return;

    const footers = step3.querySelectorAll(':scope > .button-group');
    const footer = footers.length ? footers[footers.length - 1] : null;
    if (!footer) return;

    const s41 = document.getElementById('step41Section');
    const s43 = document.getElementById('step43Section');
    [s41, s43].forEach(el => {
        if (!el) return;
        el.style.display = 'block';
        step3.insertBefore(el, footer);
    });

    step4.remove();
}

function validateCurrentStep() {
    const idx = getPageSectionIndex(currentStep);
    switch (currentStep) {
        case 1:
            if (idx >= 1) return validateRequirements();
            return validateRegistrationForm();
        case 2:
            return true;
        case 3:
            return true;
        default:
            return true;
    }
}

// Step 1: Registration Form
function validateRegistrationForm() {
    const form = document.getElementById('registrationForm');
    if (!form) return true;
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    let firstInvalid = null;

    requiredFields.forEach(field => {
        let valid = true;
        if (field.type === 'checkbox') {
            if (!field.checked) valid = false;
        } else {
            if (!field.value || !field.value.toString().trim()) valid = false;
        }

        if (!valid) {
            field.style.borderColor = 'var(--danger-color)';
            if (!firstInvalid) firstInvalid = field;
            isValid = false;
        } else {
            field.style.borderColor = 'var(--border-color)';
        }
    });
    
    if (firstInvalid) {
        try { firstInvalid.focus(); } catch(e) {}
    }
    
    if (isValid) {
        saveRegistrationData();
        return true;
    } else {
        showNotification('Please fill all required fields', 'error');
        return false;
    }
}

function saveRegistrationData() {
    userData.personal = {
        firstName: document.getElementById('firstName')?.value || '',
        lastName: document.getElementById('lastName')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        address: document.getElementById('address')?.value || '',
        typeOfProduct: document.getElementById('typeOfProduct')?.value || '',
        acceptableDocument: document.getElementById('acceptableDocument')?.value || ''
    };
    
    saveToLocalStorage();
    showNotification('Registration data saved successfully', 'success');
}

// Step 2: Company Tour
function nextTourCard() {
    if (currentTourCard < 7) {
        currentTourCard++;
        updateTourDisplay();
    }
}

function prevTourCard() {
    if (currentTourCard > 1) {
        currentTourCard--;
        updateTourDisplay();
    }
}

function goToTourCard(cardNumber) {
    currentTourCard = cardNumber;
    updateTourDisplay();
}

function updateTourDisplay() {
    document.querySelectorAll('.tour-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const currentCard = document.getElementById(`tourCard${currentTourCard}`);
    if (currentCard) {
        currentCard.classList.add('active');
    }
    
    updateTourCounter();
    
    document.querySelectorAll('.tour-dot').forEach((dot, index) => {
        dot.classList.remove('active');
        if (index === currentTourCard - 1) {
            dot.classList.add('active');
        }
    });
}

function updateTourCounter() {
    const counter = document.getElementById('tourCounter');
    if (counter) {
        counter.textContent = `Card ${currentTourCard} of 7`;
    }
}

// Requirements Navigation Variables
let currentRequirement = 1;
const totalRequirements = 3;

function initializeRequirements() {
    currentRequirement = 1;
    updateRequirementDisplay();
    updateRequirementsProgress();
}

function nextRequirement() {
    if (currentRequirement < totalRequirements) {
        currentRequirement++;
        updateRequirementDisplay();
    }
}

function prevRequirement() {
    if (currentRequirement > 1) {
        currentRequirement--;
        updateRequirementDisplay();
    }
}

function goToRequirement(reqNumber) {
    currentRequirement = reqNumber;
    updateRequirementDisplay();
}

function goToRequirementStep(reqNumber) {
    goToStep(1, 0);
    currentRequirement = reqNumber;
    updateRequirementDisplay();
}

function updateRequirementDisplay() {
    document.querySelectorAll('.requirement-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const currentCard = document.getElementById(`reqCard${currentRequirement}`);
    if (currentCard) {
        currentCard.classList.add('active');
    }
    
    updateRequirementCounter();
    
    document.querySelectorAll('.req-dot').forEach((dot, index) => {
        const reqNumber = index + 1;
        dot.classList.remove('active', 'completed');
        
        if (reqNumber === 1 && userData.requirements.terms) {
            dot.classList.add('completed');
        } else if (reqNumber === 2 && userData.requirements.money) {
            dot.classList.add('completed');
        } else if (reqNumber === 3 && userData.requirements.paymentMethod) {
            dot.classList.add('completed');
        }
        
        if (reqNumber === currentRequirement) {
            dot.classList.add('active');
        }
    });
    
    const prevBtn = document.querySelector('.req-nav-btn:first-child');
    const nextBtn = document.querySelector('.req-nav-btn:last-child');
    
    if (prevBtn) {
        prevBtn.disabled = currentRequirement === 1;
        prevBtn.style.opacity = currentRequirement === 1 ? '0.5' : '1';
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentRequirement === totalRequirements;
        nextBtn.style.opacity = currentRequirement === totalRequirements ? '0.5' : '1';
        
        if (currentRequirement === totalRequirements) {
            nextBtn.innerHTML = 'Complete <i class="fas fa-check"></i>';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        }
    }
}

function updateRequirementCounter() {
    const counter = document.getElementById('reqCounter');
    if (counter) {
        const requirementNames = [
            'Terms & Conditions',
            'Money Availability',
            'Payment Methods'
        ];
        counter.textContent = `Requirement ${currentRequirement} of ${totalRequirements}: ${requirementNames[currentRequirement - 1]}`;
    }
}

function updateRequirementsProgress() {
    let completedCount = 0;
    
    if (userData.requirements.terms) completedCount++;
    if (userData.requirements.money) completedCount++;
    if (userData.requirements.paymentMethod) completedCount++;
    
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('requirementsProgress');
    
    if (progressText) {
        progressText.textContent = `${completedCount} of ${totalRequirements} requirements completed`;
        progressText.style.color = (completedCount === totalRequirements) ? 'var(--success-color)' : '';
        progressText.style.fontWeight = (completedCount === totalRequirements) ? '700' : '';
    }
    
    if (progressFill) {
        const percentage = (completedCount / totalRequirements) * 100;
        progressFill.style.width = `${percentage}%`;
    }
    
    const step4NextBtn = document.getElementById('step4Next');
    if (step4NextBtn) {
        step4NextBtn.disabled = completedCount < totalRequirements;
    }
}

function confirmRequirement(reqNumber, confirmed) {
    const statusElement = document.getElementById(`status${reqNumber}`);
    const cardElement = document.getElementById(`reqCard${reqNumber}`);
    
    if (confirmed) {
        if (statusElement) {
            statusElement.textContent = 'Completed';
            statusElement.className = 'req-status completed';
        }
        if (cardElement) {
            cardElement.classList.add('completed');
            cardElement.classList.remove('failed');
        }
        
        switch(reqNumber) {
            case 1:
                userData.requirements.terms = true;
                break;
            case 2:
                userData.requirements.money = true;
                break;
            case 3:
                userData.requirements.paymentMethod = getSelectedPaymentMethod();
                break;
            case 4:
                userData.payment.consultation = true;
                const s43Btn = document.getElementById('step43Next');
                if (s43Btn) s43Btn.disabled = false;
                break;
        }
        
        showNotification('Requirement confirmed successfully!', 'success');
        
        if (reqNumber < totalRequirements) {
            setTimeout(() => {
                nextRequirement();
            }, 800);
        }
        
    } else {
        if (statusElement) {
            statusElement.textContent = 'Failed';
            statusElement.className = 'req-status failed';
        }
        if (cardElement) {
            cardElement.classList.add('failed');
            cardElement.classList.remove('completed');
        }
        
        showNotification('Requirement not confirmed', 'error');
        
        if (reqNumber === 1 || reqNumber === 2) {
            setTimeout(() => {
                showNotification('You must complete all requirements to proceed', 'warning');
            }, 1000);
        }
    }
    
    updateRequirementsProgress();
    
    const dot = document.querySelectorAll('.req-dot')[reqNumber - 1];
    if (dot && confirmed) {
        dot.classList.add('completed');
    } else if (dot) {
        dot.classList.remove('completed');
    }
    
    saveToLocalStorage();
    checkRequirementsCompletion();
}

function getSelectedPaymentMethod() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    return selectedMethod ? selectedMethod.value : null;
}

function selectPaymentMethod(method) {
    const methodNames = {
        'momo': 'Bank Transfer',
        'mtn': 'MTN Mobile Money',
        'cash': 'Cash',
        'visa': 'Visa Card',
        'mastercard': 'Master Card'
    };
    
    userData.requirements.paymentMethod = method;
    showNotification(`${methodNames[method] || method} payment method selected`, 'success');
    if (userData.payment && userData.payment.generatedCode) {
        delete userData.payment.generatedCode;
        const paymentCodeContainer = document.getElementById('paymentCodeContainer');
        const paymentCode = document.getElementById('paymentCode');
        const confirmationGroup = document.getElementById('confirmationGroup');
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        const paidBtn = document.getElementById('paidBtn');
        if (paymentCode) paymentCode.textContent = '';
        if (paymentCodeContainer) paymentCodeContainer.style.display = 'none';
        if (confirmationGroup) confirmationGroup.style.display = 'none';
        if (confirmBtn) confirmBtn.disabled = true;
        if (paidBtn) paidBtn.disabled = false;
    }
    saveToLocalStorage();
    updateRequirementsProgress();
}

function checkRequirementsCompletion() {
    const allCompleted = 
        userData.requirements.terms &&
        userData.requirements.money &&
        userData.requirements.paymentMethod &&
        userData.payment.consultation;
    
    if (allCompleted) {
        showNotification('All requirements completed! You can proceed to next step.', 'success');
    }
}

function validateRequirements() {
    if (!userData.requirements.terms) {
        showNotification('Please accept the terms and conditions', 'error');
        goToRequirement(1);
        return false;
    }
    if (!userData.requirements.money) {
        showNotification('Please confirm money availability', 'error');
        goToRequirement(2);
        return false;
    }
    if (!userData.requirements.paymentMethod) {
        showNotification('Please select a payment method', 'error');
        goToRequirement(3);
        return false;
    }
    return true;
}

/* ==========================================================================
   Consultation Payment (Step 2)
   ========================================================================== */
function togglePaymentDetails() {
    const directPayment = document.getElementById('directPayment');
    const paymentDetails = document.getElementById('paymentDetails');
    
    if (directPayment && directPayment.checked) {
        paymentDetails.style.display = 'block';
        renderPaymentDetails();
    } else if (paymentDetails) {
        paymentDetails.style.display = 'none';
        const nextBtn = document.getElementById('step4Next');
        if (nextBtn) {
            nextBtn.disabled = true;
        }
    }
}

function renderPaymentDetails() {
    const method = userData.requirements.paymentMethod || getSelectedPaymentMethod();
    const container = document.getElementById('selectedPaymentDetails');

    if (!container) return;

    if (!method) {
        container.innerHTML = `
            <div class="payment-code-info">
                <h4><i class="fas fa-exclamation-circle" style="color:var(--warning-color);"></i> No payment method selected</h4>
                <p class="code-info-text">Please choose a payment method in Step 1 before proceeding.</p>
                <button class="btn btn-secondary" onclick="goToStep(1, 0)" style="margin-top:10px;"><i class="fas fa-arrow-left"></i> Return to Step 1</button>
            </div>`;
        const pBtn = document.getElementById('paidBtn');
        if (pBtn) pBtn.disabled = true;
        return;
    }

    const pBtn = document.getElementById('paidBtn');
    if (pBtn) pBtn.disabled = false;

    let html = '';
    switch (method) {
        case 'momo':
            html = `
                <div class="payment-code-info">
                    <h4><i class="fas fa-university" style="color:var(--primary-color);"></i> Bank Transfer Details</h4>
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin: 12px 0;">
                        <div class="code-display-large">1002421423486</div>
                        <button type="button" class="btn-copy-code" onclick="copyText('1002421423486', 'Bank Account')"><i class="fas fa-copy"></i> Copy Account</button>
                    </div>
                    <p class="code-info-text">Make a transfer of <strong>50,000 RWF</strong> to the account above. After transferring, click <em>"I've Paid (Generate Code)"</em> below.</p>
                </div>`;
            break;
        case 'mtn':
            html = `
                <div class="payment-code-info">
                    <h4><i class="fas fa-mobile-alt" style="color:var(--warning-color);"></i> MTN Mobile Money</h4>
                    <div style="display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin: 12px 0;">
                        <div class="code-display-large">0781234567</div>
                        <button type="button" class="btn-copy-code" onclick="copyText('0781234567', 'MTN Momo Number')"><i class="fas fa-copy"></i> Copy Number</button>
                    </div>
                    <p class="code-info-text">Send <strong>50,000 RWF</strong> to the MTN Mobile Money number above. After sending, click <em>"I've Paid (Generate Code)"</em> below.</p>
                </div>`;
            break;
        case 'cash':
            html = `
                <div class="payment-code-info">
                    <h4><i class="fas fa-money-bill-wave" style="color:var(--success-color);"></i> Cash Payment at Reception</h4>
                    <p class="code-info-text">Pay at our Guichet / Counter office in person. Once paid, click <em>"I've Paid (Generate Code)"</em> to confirm.</p>
                </div>`;
            break;
        case 'visa':
        case 'mastercard':
            const cardType = method.charAt(0).toUpperCase() + method.slice(1);
            html = `
                <div class="payment-code-info">
                    <h4><i class="fas fa-credit-card" style="color:var(--primary-color);"></i> ${cardType} Payment</h4>
                    <p class="code-info-text">Secure online card processing. After completing your transaction, click <em>"I've Paid (Generate Code)"</em> below.</p>
                </div>`;
            break;
        default:
            html = `
                <div class="payment-code-info">
                    <h4><i class="fas fa-info-circle"></i> Payment Confirmation</h4>
                    <p class="code-info-text">Please complete your payment of 50,000 RWF and click <em>"I've Paid (Generate Code)"</em> to proceed.</p>
                </div>`;
    }

    container.innerHTML = html;

    const codeContainer = document.getElementById('paymentCodeContainer');
    if (codeContainer) {
        if (userData.payment.generatedCode) {
            codeContainer.style.display = 'block';
            const codeEl = document.getElementById('paymentCode');
            if (codeEl) codeEl.textContent = userData.payment.generatedCode;
        } else {
            codeContainer.style.display = 'none';
        }
    }
}

function handlePaidClick() {
    showLoading(true);
    setTimeout(() => {
        showLoading(false);
        const code = generatePaymentCode();
        userData.payment.generatedCode = code;
        saveToLocalStorage();

        const codeContainer = document.getElementById('paymentCodeContainer');
        const paymentCode = document.getElementById('paymentCode');
        const confirmationGroup = document.getElementById('confirmationGroup');
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        const paidBtn = document.getElementById('paidBtn');

        if (paymentCode) paymentCode.textContent = code;
        if (codeContainer) codeContainer.style.display = 'block';
        if (confirmationGroup) confirmationGroup.style.display = 'block';
        if (confirmBtn) confirmBtn.disabled = false;
        if (paidBtn) paidBtn.disabled = true;

        showNotification('Payment code generated! Copy it and confirm below.', 'success');
    }, 800);
}

function generatePaymentCode() {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'BSR-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += '-';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function copyPaymentCode() {
    const el = document.getElementById('paymentCode');
    if (!el) return;
    const code = (el.textContent || '').trim();
    if (!code || code.indexOf('XXXX') !== -1) {
        showNotification('No code generated yet. Click "I\'ve Paid" first.', 'error');
        return;
    }
    copyText(code, 'Payment Code');
    const input = document.getElementById('confirmationInput');
    if (input) input.value = code;
}

function confirmPayment() {
    const input = document.getElementById('confirmationInput');
    const entered = (input ? input.value : '').trim();
    const generated = userData.payment.generatedCode;

    if (!entered) {
        showNotification('Please enter the confirmation code', 'error');
        return;
    }

    if (generated && entered.toUpperCase() !== generated.toUpperCase()) {
        showNotification('Confirmation code does not match. Please verify.', 'error');
        return;
    }

    showLoading(true);
    setTimeout(() => {
        showLoading(false);
        userData.payment.consultation = true;
        userData.payment.code = entered.toUpperCase();
        userData.payment.date = new Date().toLocaleString();
        userData.timeline.payment = userData.payment.date;

        showNotification('Consultation payment verified successfully!', 'success');

        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) {
            confirmBtn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Confirmed';
            confirmBtn.disabled = true;
        }

        const step43NextBtn = document.getElementById('step43Next');
        if (step43NextBtn) step43NextBtn.disabled = false;

        saveToLocalStorage();
    }, 900);
}

function noPayment() {
    showNotification('Payment is required to proceed. Returning to previous step...', 'warning');
    setTimeout(() => {
        goToStep(1, 0);
    }, 1500);
}

function validatePayment() {
    if (!userData.payment.consultation) {
        showNotification('Please complete the payment verification before proceeding.', 'error');
        return false;
    }
    return true;
}

/* ==========================================================================
   Roles & Tier Configuration (Step 3 - Services)
   ========================================================================== */
const ROLE_CONFIG = {
    basic: {
        icon: 'fas fa-star',
        title: 'Basic Plan',
        desc: 'For individuals getting started',
        color: 'var(--basic-color)',
        label: 'Basic',
        price: 'Basic Tier',
        cardId: 'basicRole'
    },
    standard: {
        icon: 'fas fa-gem',
        title: 'Standard Plan',
        desc: 'For growing businesses & active properties',
        color: 'var(--standard-color)',
        label: 'Standard',
        price: 'Standard Tier',
        cardId: 'standardRole'
    },
    premium: {
        icon: 'fas fa-crown',
        title: 'Premium Plan',
        desc: 'Top position visibility on marketplace',
        color: 'var(--premium-color)',
        label: 'Premium',
        price: 'Premium Tier',
        cardId: 'premiumRole'
    },
    premiumExpress: {
        icon: 'fas fa-bolt',
        title: 'Premium Express Plan',
        desc: 'Urgent 24-hour visibility & direct database matching',
        color: 'var(--accent-purple)',
        label: 'Premium Express',
        price: 'Premium Express Tier',
        cardId: 'premiumExpressRole'
    }
};

function getRoleConfig(roleType) {
    return ROLE_CONFIG[roleType] || ROLE_CONFIG.basic;
}

function selectRole(roleType) {
    const roleConfig = getRoleConfig(roleType);
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.getElementById(roleConfig.cardId);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        try {
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (e) {
            selectedCard.scrollIntoView();
        }
    }

    userData.role.selected = roleType;
    userData.role.price = roleConfig.price;
    userData.role.date = new Date().toLocaleString();
    userData.timeline.roleSelection = userData.role.date;
    saveToLocalStorage();
    
    const nextButton = document.getElementById('step6Next');
    if (nextButton) nextButton.disabled = false;
    
    showNotification(`Selected ${roleConfig.label} Plan!`, 'success');
}

function finalizeRoleSelection(roleType) {
    selectRole(roleType);
}

function validateRoleSelection() {
    if (!userData.role.selected) {
        showNotification('Please select a service plan (Basic, Standard, Premium, or Premium Express)', 'error');
        return false;
    }
    return true;
}

function completeProcess() {
    showLoading(true);
    
    setTimeout(() => {
        showLoading(false);
        showSuccessModal();
    }, 1800);
}

/* ==========================================================================
   Utilities, Modals & Notifications
   ========================================================================== */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let iconName = 'info-circle';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'exclamation-circle';
    if (type === 'warning') iconName = 'triangle-exclamation';

    notification.innerHTML = `
        <i class="fas fa-${iconName}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 20);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3200);
}

function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        const okBtn = modal.querySelector('button');
        if (okBtn) okBtn.focus();
    }
}

function closeModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
}

function closeModalAndReset() {
    closeModal();
    resetForm();
}

function saveToLocalStorage() {
    localStorage.setItem('userRegistrationData', JSON.stringify(userData));
}

function loadUserData() {
    const savedData = localStorage.getItem('userRegistrationData');
    if (savedData) {
        Object.assign(userData, JSON.parse(savedData));
    }
}

function updateUIFromData() {
    if (userData.payment.generatedCode) {
        const paymentCodeContainer = document.getElementById('paymentCodeContainer');
        const paymentCode = document.getElementById('paymentCode');
        const confirmationGroup = document.getElementById('confirmationGroup');
        if (paymentCode && paymentCodeContainer) {
            paymentCode.textContent = userData.payment.generatedCode;
            paymentCodeContainer.style.display = 'block';
        }
        if (confirmationGroup) confirmationGroup.style.display = 'block';
    }

    if (userData.payment.consultation) {
        const btn = document.getElementById('confirmPaymentBtn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Confirmed';
            btn.disabled = true;
        }
        const s43Btn = document.getElementById('step43Next');
        if (s43Btn) s43Btn.disabled = false;
    }

    if (userData.role.selected) {
        const roleConfig = getRoleConfig(userData.role.selected);
        const card = document.getElementById(roleConfig.cardId);
        if (card) card.classList.add('selected');
    }
}

function resetForm() {
    document.querySelectorAll('input[type="text"], textarea').forEach(field => {
        field.value = '';
        field.disabled = false;
    });
    
    document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
        input.checked = false;
        input.disabled = false;
    });

    localStorage.removeItem('userRegistrationData');
    
    currentStep = 1;
    pageSectionIndex[1] = 0;
    pageSectionIndex[2] = 0;
    pageSectionIndex[3] = 0;
    currentTourCard = 1;
    currentRequirement = 1;
    paymentConfirmed = false;
    
    goToStep(1, 0);
    updateTourDisplay();
    
    const step4NextBtn = document.getElementById('step4Next');
    if (step4NextBtn) step4NextBtn.disabled = true;
    const step43NextBtn = document.getElementById('step43Next');
    if (step43NextBtn) step43NextBtn.disabled = true;
    
    for (let i = 1; i <= totalRequirements; i++) {
        const statusElement = document.getElementById(`status${i}`);
        if (statusElement) {
            statusElement.textContent = 'Pending';
            statusElement.className = 'req-status pending';
        }
        
        const cardElement = document.getElementById(`reqCard${i}`);
        if (cardElement) {
            cardElement.classList.remove('completed', 'failed');
        }
    }
    
    showNotification('Form has been reset', 'info');
}
