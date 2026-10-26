const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const toggleMarkup = `
    <!-- Top-Right Theme Toggle Switch -->
    <div class="auth-theme-header-bar" title="Toggle Theme (Dark / Light)">
        <i class="fa-solid fa-moon theme-icon-moon"></i>
        <label class="switch" for="authThemeToggle">
            <input class="switch__input" id="authThemeToggle" data-role="theme-toggle" type="checkbox" role="switch" aria-label="Toggle Theme">
            <span class="switch__shadow">
                <span class="switch__shadow-inner"></span>
            </span>
            <span class="switch__ball-shadow"></span>
            <span class="switch__ball-shadow-outer"></span>
            <span class="switch__ball">
                <span class="switch__ball-texture"></span>
            </span>
            <span class="switch__label">Toggle Theme</span>
        </label>
        <i class="fa-solid fa-sun theme-icon-sun"></i>
    </div>
`;

const themeHeadScript = `
    <!-- Early Theme Detection & Sync -->
    <script>
        (function() {
            const THEME_KEY = 'papermind_theme';
            const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
        })();
    </script>
`;

const themeBottomScript = `
    <!-- Sync Auth Theme Toggle Switch -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const sw = document.getElementById('authThemeToggle');
            if (sw) {
                sw.checked = (document.documentElement.getAttribute('data-theme') === 'light');
                sw.addEventListener('change', (e) => {
                    const nextTheme = e.target.checked ? 'light' : 'dark';
                    document.documentElement.setAttribute('data-theme', nextTheme);
                    localStorage.setItem('papermind_theme', nextTheme);
                });
            }
        });
    </script>
`;

// 1. UPDATE login.html
const loginPath = path.join(projectRoot, 'login.html');
let loginHtml = fs.readFileSync(loginPath, 'utf8');

// Update stylesheet version queries to prevent caching
loginHtml = loginHtml.replace(/assets\/css\/style\.css(\?v=[^"]*)?/g, 'assets/css/style.css?v=7.0');
loginHtml = loginHtml.replace(/assets\/css\/auth\.css(\?v=[^"]*)?/g, 'assets/css/auth.css?v=7.0');
loginHtml = loginHtml.replace(/assets\/css\/responsive\.css(\?v=[^"]*)?/g, 'assets/css/responsive.css?v=7.0');

// Inject head script before </head> if not present
if (!loginHtml.includes('const THEME_KEY = \'papermind_theme\';')) {
  loginHtml = loginHtml.replace('</head>', themeHeadScript + '\n</head>');
}

// Inject toggle bar after <div class="auth-wrapper"> if not present
if (!loginHtml.includes('class="auth-theme-header-bar"')) {
  loginHtml = loginHtml.replace('<div class="auth-wrapper">', '<div class="auth-wrapper">\n' + toggleMarkup);
}

// Inject bottom script before </body> if not present
if (!loginHtml.includes('Sync Auth Theme Toggle Switch')) {
  loginHtml = loginHtml.replace('</body>', themeBottomScript + '\n</body>');
}

fs.writeFileSync(loginPath, loginHtml, 'utf8');
console.log('Successfully updated login.html with theme sync and toggle bar!');

// 2. UPDATE register.html
const regPath = path.join(projectRoot, 'register.html');
let regHtml = fs.readFileSync(regPath, 'utf8');

// Update stylesheet version queries
regHtml = regHtml.replace(/assets\/css\/style\.css(\?v=[^"]*)?/g, 'assets/css/style.css?v=7.0');
regHtml = regHtml.replace(/assets\/css\/auth\.css(\?v=[^"]*)?/g, 'assets/css/auth.css?v=7.0');
regHtml = regHtml.replace(/assets\/css\/register\.css(\?v=[^"]*)?/g, 'assets/css/register.css?v=7.0');
regHtml = regHtml.replace(/assets\/css\/responsive\.css(\?v=[^"]*)?/g, 'assets/css/responsive.css?v=7.0');

// Inject head script before </head> if not present
if (!regHtml.includes('const THEME_KEY = \'papermind_theme\';')) {
  regHtml = regHtml.replace('</head>', themeHeadScript + '\n</head>');
}

// Inject toggle bar after <div class="auth-wrapper register-wrapper"> if not present
if (!regHtml.includes('class="auth-theme-header-bar"')) {
  regHtml = regHtml.replace('<div class="auth-wrapper register-wrapper">', '<div class="auth-wrapper register-wrapper">\n' + toggleMarkup);
}

// Inject bottom script before </body> if not present
if (!regHtml.includes('Sync Auth Theme Toggle Switch')) {
  regHtml = regHtml.replace('</body>', themeBottomScript + '\n</body>');
}

fs.writeFileSync(regPath, regHtml, 'utf8');
console.log('Successfully updated register.html with theme sync and toggle bar!');
