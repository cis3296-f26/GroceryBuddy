import {useNavigate, useLocation} from 'react-router-dom'
import '../App.css'
import './Dashboard.css'

function Sidebar({ setEditor, signOut}){
    const navigate = useNavigate();
    const location = useLocation();

 const NAV_ITEMS = ['Dashboard', 'Add item', 'Recipe ideas', 'Settings']

    return (
      <aside className="dash-sidebar">
      <a className="brand" href="/" aria-label="GroceryBuddy home">
        <img className="brand-mark" src="/logo.svg" alt="" />
        grocerybuddy<span className="brand-dot">.</span>
      </a>

      <nav className="dash-nav" aria-label="Dashboard">
        {NAV_ITEMS.map(label => (
          <button
            type="button"
            key={label}
            className={`dash-nav-item${location.pathname === '/dashboard' && label === 'Dashboard' ? ' active' : ''}`}
            onClick={() => {
              if (label === 'Dashboard') navigate('/dashboard');
            }}
          >
            <span className="dash-nav-dot" />
            {label}
            {label !== 'Dashboard' && (
              <span className="dash-nav-badge">Soon</span>
            )}
          </button>
        ))}
      </nav>

      <button
        type="button"
        className={`dash-nav-item${location.pathname === '/shoppinglist' ? ' active' : ''}`}
        onClick={() => navigate('/shoppinglist')}
      >
        <span className="dash-nav-dot" />
        Shopping List
      </button>

        {signOut && (
         <button type="button" className="dash-nav-item" onClick={signOut}>
        <span className="dash-nav-dot" />
        Sign out
      </button>   
        )}
      
      <div className="dash-tip">
        <strong>Tip</strong>
        <p>Used and Tossed remove an item from your inventory.</p>
      </div>
    </aside>
  );
}
export default Sidebar;
