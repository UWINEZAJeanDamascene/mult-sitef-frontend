// Lilstock Frontend Application
const API_URL = 'http://localhost:3000/api';

// State Management
const store = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  setUser(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  },
  clearUser() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },
  isAuthenticated() {
    return !!this.token;
  },
  isAdmin() {
    return this.user?.role === 'main_manager';
  }
};

// API Service
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(store.token && { Authorization: `Bearer ${store.token}` }),
      },
      ...options,
    };
    
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }
    
    return data;
  },
  
  login: (credentials) => api.request('/auth/login', { method: 'POST', body: credentials }),
  getMe: () => api.request('/auth/me'),
  getUsers: () => api.request('/auth/users'),
  createUser: (userData) => api.request('/auth/register', { method: 'POST', body: userData }),
  deleteUser: (id) => api.request(`/auth/users/${id}`, { method: 'DELETE' }),
  getSites: () => api.request('/sites'),
};

// Router
const router = {
  currentRoute: '/',
  navigate(route) {
    this.currentRoute = route;
    window.history.pushState({}, '', route);
    render();
  },
  init() {
    window.addEventListener('popstate', () => render());
  }
};

// Components
const Components = {
  // Layout
  Layout(props) {
    const isAuth = store.isAuthenticated();
    const isAdmin = store.isAdmin();
    
    return `
      <nav class="navbar">
        <div class="container navbar-content">
          <a href="/" class="logo" onclick="event.preventDefault(); router.navigate('/');">
            📦 Lilstock
          </a>
          <div class="nav-links">
            ${isAuth ? `
              <a href="/dashboard" onclick="event.preventDefault(); router.navigate('/dashboard');">Dashboard</a>
              ${isAdmin ? `<a href="/admin" onclick="event.preventDefault(); router.navigate('/admin');">User Management</a>` : ''}
              <div class="user-menu">
                <div class="user-menu-trigger" onclick="Components.toggleUserMenu()">
                  <div class="user-avatar">${store.user?.name?.[0] || 'U'}</div>
                  <div class="user-info">
                    <div class="user-name">${store.user?.name || 'User'}</div>
                    <div class="user-role">${store.user?.role?.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Logout</button>
            ` : `
              <a href="/login" onclick="event.preventDefault(); router.navigate('/login');">Login</a>
              <a href="/" class="btn btn-primary" onclick="event.preventDefault(); router.navigate('/');">Get Started</a>
            `}
          </div>
        </div>
      </nav>
      <main>${props.children}</main>
    `;
  },
  
  // Landing Page
  LandingPage() {
    return `
      <div class="hero">
        <div class="container">
          <h1>Multi-Site Stock Management</h1>
          <p>Streamline inventory tracking across multiple construction sites with real-time synchronization to central stock.</p>
          <div class="hero-buttons">
            <button class="btn btn-primary btn-lg" onclick="router.navigate('/login')">Get Started</button>
            <button class="btn btn-secondary btn-lg" onclick="document.getElementById('features').scrollIntoView({behavior: 'smooth'})">Learn More</button>
          </div>
        </div>
      </div>
      
      <section id="features" class="features">
        <div class="container">
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📍</div>
              <h3>Site Management</h3>
              <p>Manage multiple construction sites with dedicated stock records. Site managers can log materials used with no price access.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>Central Stock Control</h3>
              <p>Main stock manager has full visibility and control. Auto-sync from sites with pricing management.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📈</div>
              <h3>Real-time Views</h3>
              <p>Instant access to used materials and remaining stock views. Filter by site, material, or date range.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <h3>Role-Based Access</h3>
              <p>Secure access control with site managers and main stock managers. Only authorized personnel can modify records.</p>
            </div>
          </div>
        </div>
      </section>
    `;
  },
  
  // Login Page
  LoginPage() {
    return `
      <div class="auth-container">
        <div class="auth-box">
          <div class="auth-header">
            <a href="/" class="logo" onclick="event.preventDefault(); router.navigate('/');">📦 Lilstock</a>
            <h2>Welcome back</h2>
            <p>Sign in to access your dashboard</p>
          </div>
          <div id="login-error"></div>
          <form id="login-form" onsubmit="handleLogin(event)">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" name="email" class="form-input" placeholder="admin@lilstock.com" required value="admin@lilstock.com">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" name="password" class="form-input" placeholder="••••••••" required value="admin123">
            </div>
            <div class="form-group">
              <label class="form-label">Company ID</label>
              <input type="text" name="company_id" class="form-input" placeholder="default-company" required value="default-company">
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
              Sign In
            </button>
          </form>
          <p class="text-center mt-4" style="font-size: 0.875rem; color: var(--gray-600);">
            Default login: <strong>admin@lilstock.com</strong> / <strong>admin123</strong>
          </p>
        </div>
      </div>
    `;
  },
  
  // Dashboard Page
  DashboardPage() {
    return `
      <div class="dashboard">
        <div class="container">
          <div class="page-header">
            <h1>Dashboard</h1>
          </div>
          
          <div class="features-grid">
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">🏗️ Sites</h3>
              </div>
              <p style="color: var(--gray-600); margin-bottom: 1rem;">Manage your construction sites and view their stock records.</p>
              <button class="btn btn-primary" onclick="router.navigate('/sites')">View Sites</button>
            </div>
            
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">📦 Main Stock</h3>
              </div>
              <p style="color: var(--gray-600); margin-bottom: 1rem;">Access central inventory with pricing and valuation.</p>
              <button class="btn btn-primary" onclick="router.navigate('/main-stock')">View Stock</button>
            </div>
            
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">📊 Reports</h3>
              </div>
              <p style="color: var(--gray-600); margin-bottom: 1rem;">View used materials and remaining stock reports.</p>
              <button class="btn btn-primary" onclick="router.navigate('/reports')">View Reports</button>
            </div>
            
            ${store.isAdmin() ? `
            <div class="card">
              <div class="card-header">
                <h3 class="card-title">👥 User Management</h3>
              </div>
              <p style="color: var(--gray-600); margin-bottom: 1rem;">Create and manage users for your organization.</p>
              <button class="btn btn-primary" onclick="router.navigate('/admin')">Manage Users</button>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },
  
  // Admin User Management Page
  AdminPage() {
    if (!store.isAdmin()) {
      router.navigate('/dashboard');
      return '';
    }
    
    // Load users data
    setTimeout(() => this.loadUsers(), 0);
    
    return `
      <div class="dashboard">
        <div class="container">
          <div class="page-header">
            <h1>User Management</h1>
            <button class="btn btn-primary" onclick="Components.openUserModal()">
              + Create User
            </button>
          </div>
          
          <div class="card">
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="users-table">
                  <tr>
                    <td colspan="5" class="text-center">
                      <div class="loading">
                        <div class="spinner"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Create User Modal -->
      <div id="user-modal" class="modal-overlay hidden" onclick="Components.closeUserModal(event)">
        <div class="modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New User</h3>
            <button class="modal-close" onclick="Components.closeUserModal()">&times;</button>
          </div>
          <form id="create-user-form" onsubmit="Components.handleCreateUser(event)">
            <div class="modal-body">
              <div id="create-user-error"></div>
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" name="name" class="form-input" required>
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" name="email" class="form-input" required>
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input type="password" name="password" class="form-input" required minlength="6">
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select name="role" class="form-input form-select" required>
                  <option value="site_manager">Site Manager</option>
                  <option value="main_manager">Main Manager</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Company ID</label>
                <input type="text" name="company_id" class="form-input" value="${store.user?.company_id || 'default-company'}" required>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="Components.closeUserModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Create User</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },
  
  async loadUsers() {
    try {
      // For now, just show current user since we don't have a list endpoint
      const tbody = document.getElementById('users-table');
      if (!tbody) return;
      
      tbody.innerHTML = `
        <tr>
          <td><strong>${store.user?.name}</strong> (You)</td>
          <td>${store.user?.email}</td>
          <td><span class="badge badge-green">${store.user?.role?.replace('_', ' ')}</span></td>
          <td><span class="badge badge-blue">Active</span></td>
          <td>-</td>
        </tr>
      `;
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  },
  
  openUserModal() {
    document.getElementById('user-modal').classList.remove('hidden');
  },
  
  closeUserModal(event) {
    if (!event || event.target === document.getElementById('user-modal')) {
      document.getElementById('user-modal')?.classList.add('hidden');
    }
  },
  
  async handleCreateUser(event) {
    event.preventDefault();
    const form = event.target;
    const errorDiv = document.getElementById('create-user-error');
    
    try {
      const userData = {
        name: form.name.value,
        email: form.email.value,
        password: form.password.value,
        role: form.role.value,
        company_id: form.company_id.value,
      };
      
      await api.createUser(userData);
      
      errorDiv.innerHTML = '<div class="auth-success">User created successfully!</div>';
      form.reset();
      
      setTimeout(() => {
        Components.closeUserModal();
        Components.loadUsers();
      }, 1500);
    } catch (error) {
      errorDiv.innerHTML = `<div class="auth-error">${error.message}</div>`;
    }
  },
  
  toggleUserMenu() {
    // Simple toggle - could be expanded
  }
};

// Event Handlers
async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const errorDiv = document.getElementById('login-error');
  
  try {
    const credentials = {
      email: form.email.value,
      password: form.password.value,
      company_id: form.company_id.value,
    };
    
    const data = await api.login(credentials);
    store.setUser(data.user, data.token);
    
    router.navigate('/dashboard');
  } catch (error) {
    errorDiv.innerHTML = `<div class="auth-error">${error.message}</div>`;
  }
}

function handleLogout() {
  store.clearUser();
  router.navigate('/');
}

// Render Function
function render() {
  const path = window.location.pathname;
  const isAuth = store.isAuthenticated();
  
  // Protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/sites', '/main-stock', '/reports'];
  if (protectedRoutes.includes(path) && !isAuth) {
    router.navigate('/login');
    return;
  }
  
  // Admin-only routes
  if (path === '/admin' && !store.isAdmin()) {
    router.navigate('/dashboard');
    return;
  }
  
  let content;
  switch (path) {
    case '/':
      content = isAuth ? Components.DashboardPage() : Components.LandingPage();
      break;
    case '/login':
      content = isAuth ? Components.DashboardPage() : Components.LoginPage();
      break;
    case '/dashboard':
      content = Components.DashboardPage();
      break;
    case '/admin':
      content = Components.AdminPage();
      break;
    default:
      content = Components.LandingPage();
  }
  
  // Don't wrap auth pages in layout
  const isAuthPage = path === '/login';
  if (isAuthPage) {
    document.getElementById('app').innerHTML = content;
  } else {
    document.getElementById('app').innerHTML = Components.Layout({ children: content });
  }
}

// Initialize
router.init();
render();

// Expose to window for inline event handlers
window.router = router;
window.Components = Components;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
