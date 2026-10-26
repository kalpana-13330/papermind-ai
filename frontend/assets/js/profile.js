/**
 * AI Research Paper Summarizer - Profile Page Controller
 * Handles user profile display, name editing, and password update.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!window.authAPI || !window.authAPI.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    setTimeout(() => pageLoader.classList.add('fade-out'), 400);
  }

  // Load User Data
  async function loadProfile() {
    try {
      let user = window.authAPI.getUser();
      try {
        const res = await window.authAPI.getMe();
        if (res && res.data && res.data.user) {
          user = res.data.user;
        }
      } catch (e) {
        console.warn('Using cached user profile data:', e);
      }

      if (!user) return;

      const displayName = user.name || user.email.split('@')[0];
      const email = user.email || '';
      const customAvatar = localStorage.getItem('papermind_custom_avatar') || (user && user.avatar);
      const avatarUrl = customAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&rounded=true&size=128`;

      // Update Hero Section
      const heroName = document.getElementById('heroUserName');
      if (heroName) heroName.textContent = displayName;

      const heroEmail = document.getElementById('heroUserEmail');
      if (heroEmail) heroEmail.textContent = email;

      const heroAvatar = document.getElementById('heroUserAvatar');
      if (heroAvatar) heroAvatar.src = avatarUrl;

      // Update Form Inputs
      const inputName = document.getElementById('profileNameInput');
      if (inputName) inputName.value = displayName;

      const inputEmail = document.getElementById('profileEmailInput');
      if (inputEmail) inputEmail.value = email;

      // Update Member Since
      const memberSince = document.getElementById('memberSinceDate');
      if (memberSince && user.createdAt) {
        const d = new Date(user.createdAt);
        memberSince.textContent = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }

      // Load Paper Stats
      if (window.paperAPI) {
        try {
          const papersRes = await window.paperAPI.getPapers(1, 100);
          if (papersRes && papersRes.data && papersRes.data.papers) {
            const papers = papersRes.data.papers;
            const totalPapers = papersRes.data.pagination ? papersRes.data.pagination.total : papers.length;
            const completedSummaries = papers.filter(p => p.status === 'completed').length;

            const papersCountEl = document.getElementById('profilePapersCount');
            if (papersCountEl) papersCountEl.textContent = totalPapers;

            const summariesCountEl = document.getElementById('profileSummariesCount');
            if (summariesCountEl) summariesCountEl.textContent = completedSummaries;
          }
        } catch (err) {
          console.warn('Could not load paper stats:', err);
        }
      }

      if (window.updateHeaderUserInfo) {
        window.updateHeaderUserInfo();
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }

  await loadProfile();

  // Avatar Upload Listener in Profile Page
  const profileAvatarInput = document.getElementById('profilePageAvatarInput');
  if (profileAvatarInput) {
    profileAvatarInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (window.handleProfileImageUpload) {
        window.handleProfileImageUpload(file, (dataUrl) => {
          const heroAvatar = document.getElementById('heroUserAvatar');
          if (heroAvatar) heroAvatar.src = dataUrl;
          showAlert(profileAlert, 'Profile picture updated successfully!', 'success');
        }, (err) => {
          showAlert(profileAlert, err, 'error');
        });
      }
    });
  }

  // Handle Edit Profile Form
  const editProfileForm = document.getElementById('editProfileForm');
  const profileAlert = document.getElementById('profileAlert');

  if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('profileNameInput');
      const submitBtn = editProfileForm.querySelector('button[type="submit"]');
      const nameVal = nameInput ? nameInput.value.trim() : '';

      if (!nameVal || nameVal.length < 2) {
        showAlert(profileAlert, 'Name must be at least 2 characters long.', 'error');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        const res = await window.authAPI.updateProfile(nameVal);
        showAlert(profileAlert, 'Profile name updated successfully!', 'success');

        // Refresh UI
        await loadProfile();
      } catch (err) {
        showAlert(profileAlert, err.message || 'Failed to update profile.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes';
        }
      }
    });
  }

  // Handle Change Password Form
  const changePasswordForm = document.getElementById('changePasswordForm');
  const passwordAlert = document.getElementById('passwordAlert');

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPasswordInput = document.getElementById('currentPasswordInput');
      const newPasswordInput = document.getElementById('newPasswordInput');
      const confirmPasswordInput = document.getElementById('confirmPasswordInput');
      const submitBtn = changePasswordForm.querySelector('button[type="submit"]');

      const currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
      const newPassword = newPasswordInput ? newPasswordInput.value : '';
      const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

      if (!currentPassword || !newPassword) {
        showAlert(passwordAlert, 'Please fill in both current and new passwords.', 'error');
        return;
      }

      if (newPassword.length < 6) {
        showAlert(passwordAlert, 'New password must be at least 6 characters long.', 'error');
        return;
      }

      if (newPassword !== confirmPassword) {
        showAlert(passwordAlert, 'New passwords do not match.', 'error');
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
        }

        await window.authAPI.changePassword(currentPassword, newPassword);
        showAlert(passwordAlert, 'Password updated successfully!', 'success');
        changePasswordForm.reset();
      } catch (err) {
        showAlert(passwordAlert, err.message || 'Failed to update password.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-key"></i> Update Password';
        }
      }
    });
  }

  function showAlert(alertEl, message, type) {
    if (!alertEl) return;
    alertEl.textContent = message;
    alertEl.className = `alert-message alert-${type}`;
    alertEl.style.display = 'flex';
    setTimeout(() => {
      alertEl.style.display = 'none';
    }, 5000);
  }
});
