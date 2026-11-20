import {useNavigate, useLocation} from 'react-router-dom'
import '../App.css'
import './Dashboard.css'

function Sidebar({ setEditor, signOut}){
    const navigate = useNavigate();
    const location = useLocation();

const NAV_ITEMS = ['Dashboard', 'Add item', 'Shopping list', 'Recipe ideas', 'Prior Wastes', 'Settings']

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
            className={`dash-nav-item${(label === 'Dashboard' && window.location.pathname === '/dashboard') ||
            (label === 'Prior Wastes' && window.location.pathname === '/priorwastes') ||
            (label === 'Shopping list' && window.location.pathname === '/shoppinglist') ? ' active' : ''}`}
            aria-current={
            window.location.pathname === '/dashboard' && label === 'Dashboard' || 
            window.location.pathname === '/priorwastes' && label === 'Prior Wastes' ||
            window.location.pathname === '/shoppinglist' && label === 'Shopping list'
            ? 'page'
            :undefined
            }
            onClick={() => {
              if(label === 'Dashboard') navigate('/dashboard');
            else if(label === 'Shopping list') navigate('/shoppinglist');
            else if(label === 'Prior Wastes') navigate('/priorwastes');
            else if (label === 'Add item') setEditor({item: null});
            }}
          >
            <span className="dash-nav-dot" />
            {label}
            {!['Dashboard', 'Add item', 'Shopping list', 'Prior Wastes'].includes(label) && <span className="dash-nav-badge">Soon</span>}
          </button>
        ))}
      </nav>

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
