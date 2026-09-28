// auth-modal.js
let pendingRedirectUrl = null;
let pendingSignupData = null;

// Initialize when DOM is ready
function initAuthModal() {
  if (document.getElementById('lizonGlobalAuthModal')) return;

  const authModalStyles = document.createElement('style');
  authModalStyles.innerHTML = `
    .lizon-auth-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(4, 7, 10, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      z-index: 99999;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .lizon-auth-backdrop.active { display: flex; }
    .lizon-auth-box {
      background: #0D141C;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      width: 100%;
      max-width: 440px;
      padding: 30px 24px;
      position: relative;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.75);
      animation: authSlideIn 0.22s ease-out;
      color: #F8FAFC;
    }
    @keyframes authSlideIn {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .lizon-close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94A3B8;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .lizon-close-btn:hover { color: #FFF; background: rgba(255, 255, 255, 0.12); }
    .lizon-auth-header { text-align: center; margin-bottom: 20px; }
    .lizon-auth-header h3 { font-size: 1.3rem; font-weight: 800; color: #FFF; margin-bottom: 4px; }
    .lizon-auth-header p { font-size: 0.85rem; color: #94A3B8; line-height: 1.4; }
    .lizon-tabs {
      display: flex;
      background: rgba(255, 255, 255, 0.04);
      padding: 4px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 18px;
    }
    .lizon-tab-btn {
      flex: 1;
      padding: 9px;
      border-radius: 7px;
      border: none;
      background: transparent;
      color: #94A3B8;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .lizon-tab-btn.active { background: rgba(255, 255, 255, 0.08); color: #FFF; }
    .lizon-group { margin-bottom: 12px; text-align: left; }
    .lizon-label { display: block; font-size: 0.725rem; font-weight: 700; color: #94A3B8; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    .lizon-input, .lizon-select {
      width: 100%;
      background: #080D12;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #FFF;
      padding: 10px 13px;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .lizon-input:focus, .lizon-select:focus { border-color: #10B981; }
    .lizon-submit-btn {
      width: 100%;
      background: #10B981;
      color: #042F20;
      font-weight: 700;
      padding: 11px;
      border-radius: 9px;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      margin-top: 8px;
      transition: all 0.2s;
    }
    .lizon-submit-btn:hover { background: #34D399; }
    .lizon-err {
      display: none;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #F87171;
      padding: 8px 12px;
      border-radius: 7px;
      font-size: 0.8rem;
      margin-bottom: 14px;
      text-align: center;
    }
    .lizon-success {
      display: none;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34D399;
      padding: 8px 12px;
      border-radius: 7px;
      font-size: 0.8rem;
      margin-bottom: 14px;
      text-align: center;
    }
    .otp-display-box {
      text-align: center;
      letter-spacing: 6px;
      font-size: 1.4rem;
      font-weight: 800;
    }
  `;
  document.head.appendChild(authModalStyles);

  const authModalContainer = document.createElement('div');
  authModalContainer.className = 'lizon-auth-backdrop';
  authModalContainer.id = 'lizonGlobalAuthModal';
  authModalContainer.onclick = function(e) {
    if (e.target.id === 'lizonGlobalAuthModal') closeAuthModal();
  };

  authModalContainer.innerHTML = `
    <div class="lizon-auth-box">
      <button class="lizon-close-btn" onclick="closeAuthModal()">✕</button>
      
      <div class="lizon-auth-header">
        <h3 id="lizonAuthMainTitle">LizOn Student Portal</h3>
        <p id="lizonAuthSubText">Sign in or register to take exams and track progress</p>
      </div>

      <div class="lizon-tabs" id="lizonNavTabs">
        <button class="lizon-tab-btn active" id="lizonTabLoginBtn" onclick="toggleAuthModalTab('login')">Sign In</button>
        <button class="lizon-tab-btn" id="lizonTabSignupBtn" onclick="toggleAuthModalTab('signup')">Sign Up</button>
      </div>

      <div class="lizon-err" id="lizonAuthError"></div>
      <div class="lizon-success" id="lizonAuthSuccess"></div>

      <!-- 1. Sign In Form -->
      <form id="lizonLoginForm" onsubmit="submitAuthModalLogin(event)">
        <div class="lizon-group">
          <label class="lizon-label">Email Address</label>
          <input type="email" id="modalLoginEmail" class="lizon-input" placeholder="e.g. name@gmail.com" required />
        </div>
        <div class="lizon-group">
          <label class="lizon-label">Password</label>
          <input type="password" id="modalLoginPass" class="lizon-input" placeholder="••••••••" required />
        </div>
        <button type="submit" class="lizon-submit-btn" id="modalLoginBtnText">Sign In</button>
      </form>

      <!-- 2. Sign Up Form -->
      <form id="lizonSignupForm" style="display: none;" onsubmit="submitAuthModalSignup(event)">
        <div class="lizon-group">
          <label class="lizon-label">Full Name</label>
          <input type="text" id="modalRegName" class="lizon-input" placeholder="Your name" required />
        </div>
        <div class="lizon-group">
          <label class="lizon-label">Email Address</label>
          <input type="email" id="modalRegEmail" class="lizon-input" placeholder="you@gmail.com" required />
        </div>
        <div class="lizon-group">
          <label class="lizon-label">Mobile Number</label>
          <input type="tel" id="modalRegPhone" class="lizon-input" placeholder="017XXXXXXXX" required />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="lizon-group">
            <label class="lizon-label">Target Score</label>
            <select id="modalRegScore" class="lizon-select">
              <option value="Band 6.5">IELTS 6.5</option>
              <option value="Band 7.0">IELTS 7.0</option>
              <option value="Band 7.5+">IELTS 7.5+</option>
              <option value="PTE 65">PTE 65</option>
              <option value="PTE 79+">PTE 79+</option>
            </select>
          </div>
          <div class="lizon-group">
            <label class="lizon-label">Desired Country</label>
            <select id="modalRegCountry" class="lizon-select">
              <option value="UK">UK</option>
              <option value="Australia">Australia</option>
              <option value="Canada">Canada</option>
              <option value="USA">USA</option>
              <option value="Europe">Europe</option>
            </select>
          </div>
        </div>
        
        <!-- Passwords -->
        <div class="lizon-group">
          <label class="lizon-label">Create Password</label>
          <input type="password" id="modalRegPass" class="lizon-input" placeholder="Min. 6 characters" required />
        </div>
        <div class="lizon-group">
          <label class="lizon-label">Retype Password</label>
          <input type="password" id="modalRegPassConfirm" class="lizon-input" placeholder="Re-enter password" required />
        </div>

        <button type="submit" class="lizon-submit-btn" id="modalRegBtnText">Send Verification Code</button>
      </form>

      <!-- 3. OTP Verification Form -->
      <form id="lizonOtpForm" style="display: none;" onsubmit="submitAuthModalOtp(event)">
        <div class="lizon-group">
          <label class="lizon-label" style="text-align: center;">Enter 6-Digit Email OTP</label>
          <input type="text" id="modalOtpCode" class="lizon-input otp-display-box" maxlength="8" placeholder="••••••" required />
        </div>
        <button type="submit" class="lizon-submit-btn" id="modalOtpBtnText">Verify & Activate Account</button>
        <div style="text-align: center; margin-top: 14px;">
          <button type="button" onclick="cancelOtpFlow()" style="background:transparent; border:none; color:#94A3B8; font-size:0.8rem; cursor:pointer; text-decoration:underline;">← Back to details</button>
        </div>
      </form>

    </div>
  `;
  document.body.appendChild(authModalContainer);

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('prompt') === '1') {
    if (typeof supabase !== 'undefined') {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) openAuthModal();
      });
    } else {
      openAuthModal();
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthModal);
} else {
  initAuthModal();
}

function openAuthModal(targetUrl = null) {
  pendingRedirectUrl = targetUrl;
  const modal = document.getElementById('lizonGlobalAuthModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('lizonGlobalAuthModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function toggleAuthModalTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('lizonNavTabs').style.display = 'flex';
  document.getElementById('lizonLoginForm').style.display = isLogin ? 'block' : 'none';
  document.getElementById('lizonSignupForm').style.display = isLogin ? 'none' : 'block';
  document.getElementById('lizonOtpForm').style.display = 'none';
  document.getElementById('lizonTabLoginBtn').classList.toggle('active', isLogin);
  document.getElementById('lizonTabSignupBtn').classList.toggle('active', !isLogin);
  
  document.getElementById('lizonAuthMainTitle').innerText = "LizOn Student Portal";
  document.getElementById('lizonAuthSubText').innerText = "Sign in or register to take exams and track progress";

  hideAuthAlerts();
}

// Navigates & flags for login popup if not signed in
async function navigateToModule(targetPageUrl) {
  if (typeof supabase === 'undefined') {
    window.location.href = targetPageUrl;
    return;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = targetPageUrl;
    } else {
      window.location.href = targetPageUrl + '?prompt=1';
    }
  } catch (e) {
    window.location.href = targetPageUrl;
  }
}

// Strictly Requires Auth (Used by Take Test buttons)
async function requireAuth(targetUrl) {
  if (typeof supabase === 'undefined') {
    window.location.href = targetUrl;
    return;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      window.location.href = targetUrl;
    } else {
      openAuthModal(targetUrl);
    }
  } catch (e) {
    openAuthModal(targetUrl);
  }
}

// 1. Submit Sign In
async function submitAuthModalLogin(e) {
  e.preventDefault();
  hideAuthAlerts();

  const email = document.getElementById('modalLoginEmail').value.trim();
  const password = document.getElementById('modalLoginPass').value;
  const btn = document.getElementById('modalLoginBtnText');
  btn.innerText = "Signing in...";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    showAuthError(error.message);
    btn.innerText = "Sign In";
    return;
  }

  handlePostAuthRedirect(data.user);
}

// 2. Submit Sign Up (Validates matching passwords & triggers OTP email)
async function submitAuthModalSignup(e) {
  e.preventDefault();
  hideAuthAlerts();

  const full_name = document.getElementById('modalRegName').value.trim();
  const email = document.getElementById('modalRegEmail').value.trim();
  const phone = document.getElementById('modalRegPhone').value.trim();
  const desire_score = document.getElementById('modalRegScore').value;
  const desire_country = document.getElementById('modalRegCountry').value;
  const password = document.getElementById('modalRegPass').value;
  const passwordConfirm = document.getElementById('modalRegPassConfirm').value;

  // Password matching check
  if (password !== passwordConfirm) {
    showAuthError("Passwords do not match. Please retype carefully.");
    return;
  }

  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters long.");
    return;
  }

  const btn = document.getElementById('modalRegBtnText');
  btn.innerText = "Sending Code...";

  // Cache data to insert into profiles table upon OTP confirmation
  pendingSignupData = { full_name, email, phone, desire_score, desire_country };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone, desire_score, desire_country }
    }
  });

  if (error) {
    showAuthError(error.message);
    btn.innerText = "Send Verification Code";
    return;
  }

  // If Supabase immediately returns a session (e.g., email confirmation turned off in project)
  if (data.session) {
    handlePostAuthRedirect(data.user);
    return;
  }

  // Switch to OTP Verification View
  document.getElementById('lizonNavTabs').style.display = 'none';
  document.getElementById('lizonSignupForm').style.display = 'none';
  document.getElementById('lizonOtpForm').style.display = 'block';

  document.getElementById('lizonAuthMainTitle').innerText = "Check Your Email";
  document.getElementById('lizonAuthSubText').innerHTML = `We sent a 6-digit confirmation code to <br><strong style="color:#FFF;">${email}</strong>`;
  
  showAuthSuccess("Verification code sent! Please check your inbox or spam folder.");
  btn.innerText = "Send Verification Code";
}

// 3. Submit OTP Code Verification
async function submitAuthModalOtp(e) {
  e.preventDefault();
  hideAuthAlerts();

  const token = document.getElementById('modalOtpCode').value.trim();
  const btn = document.getElementById('modalOtpBtnText');
  btn.innerText = "Verifying...";

  if (!pendingSignupData || !pendingSignupData.email) {
    showAuthError("Session expired. Please enter your registration details again.");
    cancelOtpFlow();
    return;
  }

  // Verify OTP token with Supabase Auth
  const { data, error } = await supabase.auth.verifyOtp({
    email: pendingSignupData.email,
    token: token,
    type: 'signup'
  });

  if (error) {
    showAuthError(error.message || "Invalid or expired code. Please check and try again.");
    btn.innerText = "Verify & Activate Account";
    return;
  }

  // Ensure record is saved to the profiles table for the admin dashboard
  if (data.user) {
    try {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: pendingSignupData.full_name,
        email: pendingSignupData.email,
        phone: pendingSignupData.phone,
        desire_score: pendingSignupData.desire_score,
        desire_country: pendingSignupData.desire_country,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Profile sync warning:", err);
    }
  }

  showAuthSuccess("Account verified successfully!");
  setTimeout(() => {
    handlePostAuthRedirect(data.user);
  }, 600);
}

function cancelOtpFlow() {
  document.getElementById('lizonNavTabs').style.display = 'flex';
  document.getElementById('lizonOtpForm').style.display = 'none';
  document.getElementById('lizonSignupForm').style.display = 'block';
  document.getElementById('lizonAuthMainTitle').innerText = "LizOn Student Portal";
  document.getElementById('lizonAuthSubText').innerText = "Sign in or register to take exams and track progress";
  hideAuthAlerts();
}

function handlePostAuthRedirect(user) {
  closeAuthModal();
  if (user && user.email === 'swapnil7kuri@gmail.com') {
    window.location.href = 'admin.html';
    return;
  }
  if (pendingRedirectUrl) {
    window.location.href = pendingRedirectUrl;
  } else {
    window.location.reload();
  }
}

function showAuthError(msg) {
  const err = document.getElementById('lizonAuthError');
  err.innerText = msg;
  err.style.display = 'block';
  document.getElementById('lizonAuthSuccess').style.display = 'none';
}

function showAuthSuccess(msg) {
  const sc = document.getElementById('lizonAuthSuccess');
  sc.innerText = msg;
  sc.style.display = 'block';
  document.getElementById('lizonAuthError').style.display = 'none';
}

function hideAuthAlerts() {
  document.getElementById('lizonAuthError').style.display = 'none';
  document.getElementById('lizonAuthSuccess').style.display = 'none';
}