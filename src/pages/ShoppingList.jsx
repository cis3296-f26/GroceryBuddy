import React, {useMemo, useState} from "react";
import "./ShoppingList.css";
import '../App.css'
import './Dashboard.css'
import Sidebar from './Sidebar.jsx'

const initial_items = [
    {
        id:1,
        name:"Strawberries",
        category:"Produce",
        quantity:"1",
        emoji:"🍓",
        price:"4.99",
        checked:false,

    },
    {
        id:2,
        name:"Bananas",
        category:"Produce",
        quantity:"3",
        emoji:"🍌",
        price:2.49,
        checked:true,

    },

    {
        id:3,
        name:"Milk",
        category:"Dairy",
        quantity:"2",
        emoji:"🥛",
        price:4.99,
        checked:false,

    }
]

const categories = ["All Items", "Produce", "Dairy", "Pantry", "Frozen", "Other"];

const category_meta = {
    Produce: {emoji: "🍎"},
    Pantry: {emoji: "🍪"},
    Frozen: {emoji: "🧊"},
    Dairy: {emoji: "🥛"},
    Other: {emoji: "🍱"}
};


export default function ShoppingList(){
    const[items, setItems] = useState(initial_items);
    const[activeCategory, setActiveCategory] = useState("All Items");
    const[showAllSuggestions, setShowAllSuggestions] = useState("All Items");
    const[showSuggestionBanner, setShowSuggestionBanner] = useState(true);
    const[showAddForm, setShowAddForm] = useState(false);
    const[shoppingMode, setShoppingMode] = useState(false);
    const[newItem, setNewItem] = useState({
        name:"",
        quantity: "1",
        category: "Other",
        price: "",
    });

    const checkedCount = items.filter((item) => item.checked).length;
    const totalCount = items.length;

    const progress = totalCount
    ? Math.round((checkedCount / totalCount) * 100)
    : 0;

    const estimatedTotal = items.reduce(
        (sum, item) => sum + (Number(item.price) || 0),
        0
    );

    const visibleItems = useMemo(() => {
        return activeCategory === "All Items"
        ? items
        :items.filter((item) => item.category === activeCategory);
    }, [items, activeCategory]);

    const groupedItems = categories.slice(1)
        .map((category) => ({
        category,
        items: visibleItems.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);

    const handleGenerateList = () => {
        alert("Your shopping list will be generated")
    };

    function toggleItem(id){
        setItems((current) =>
        current.map((item) =>
        item.id === id
    ? {...item, checked: !item.checked}
        :item));
    }

    function addItem(item) {
        const cleanName = item.name.trim();

        if(!cleanName) return;

        setItems((current) => [
            ...current,
            {
                id: `${Date.now()}-${Math.random()}`,
                name: cleanName,
                category: item.category || guessCategory(cleanName),
                quantity: item.quantity || "1",
                emoji: item.emoji || getEmoji(cleanName),
                price: Number(item.price) || 0,
                checked: false,
            },
        ]);
    }

    function handleAddSubmit(event){
        event.preventDefault();

        if(!newItem.name.trim()) return;

        addItem({
            name: newItem.name,
            quantity: newItem.quantity || "1",
            category:
            newItem.category === "Auto-detect"
            ? guessCategory(newItem.name)
            :newItem.category,
            price: newItem.price,
        });

        setNewItem({
            name: "",
            quantity: "1",
            category: "Other",
            price: "",
        });
        setShowAddForm(false);
    }
const suggestions = [
            {
                name: "Bread",
                category: "Pantry",
                quantity: "1 loaf",
                emoji: "🍞",
                price: 3.49,
            },

            {
                name: "Apples",
                category: "Produce",
                quantity: "4", 
                emoji: "🍎",
                price: 3.99,
            },
        ];

    function addSuggestedItems(){
suggestions.forEach((suggestion) => {
    const exists = items.some(
        (item) => 
            item.name.toLowerCase() ===
        suggestion.name.toLowerCase()
    );

    if(!exists){
        addItem(suggestion);
    }
        });
    }

    function guessCategory(name){
        const food = name.toLowerCase();

        if(["apple", "banana", "strawberry", "lettuce", "spinach"].some(item => food.includes(item))){
            return "Produce";
        }

        if(["milk", "cheese", "yogurt", "butter"].some(item => food.includes(item))){
            return "Dairy";
        }

        if(["frozen pizza", "frozen berries", "ice cream"].some(item => food.includes(item))){
            return "Frozen";
        }

        return "Pantry";
    }

    function getEmoji(name){
        const food = name.toLowerCase();

        if(food.includes("strawberr")) return "🍓";
        if(food.includes("banana")) return "🍌";
        if(food.includes("oranges")) return "🍊"

        return "🛒";
    }

    function clearCategory(category){
        setItems((current) =>
        current.filter((item) => item.category !== category)
    );
    }

    function clearCompleted(){
        setItems((current) =>
        current.filter((item) => !item.checked));
    }

    function clearList(){
        setItems([]);
    }


    return (
        <div className="dash-shell">
                <Sidebar />
        <main className={`shopping-page ${shoppingMode ? "shopping-page--mode" : ""}`}>
            
            <div className="shopping-heading">
    <div className="heading-content">
        <h1>Shopping List</h1>
        <p>
            Everything you need for your next grocery trip.
        </p>
    </div>
    
        <div className="heading-actions">
    <button type="button"
    className="generate-button"
    onClick={handleGenerateList}>✨ Generate List</button>

    <button
        className="primary-button add-list-button"
        onClick={() => setShowAddForm(true)}
    >
        <span aria-hidden="true">🛒</span> Add to List
    </button>
    </div>
</div>
        

            <div className="shopping-content-grid">
                <section className="list-column">
                    <nav
                    className="category-tabs"
                    aria-label="Filter shopping list"
                    >
                        {categories.map((category) => (
                            <button
                            key={category}
                            className={`category-tab ${
                                activeCategory === category
                                ? "category-tab--active"
                                :""
                            }`}
                            onClick={() => setActiveCategory(category)}
                            >
                                {category}
                            </button>
                        ))}
                    </nav>

                    {groupedItems.length ? (
                        groupedItems.map(({ category, items: categoryItems} ) => (
                            <section className="category-section"
                            key={category}
                            >
                            <header className="category-section-heading">
                                <h2>
                                    <span>{category_meta[category].emoji}</span>
                                    {category}
                                    <span className="item-count">
                                        ({categoryItems.length})
                                    </span>
                                </h2>

                                <button onClick={() => clearCategory(category)}>
                                    Clear section
                                </button>
                            </header>

                            <div className="category-items">
                                {categoryItems.map((item) => (
                                    <div className={`grocery-row ${
                                        item.checked ? "grocery-row--checked" : ""
                                    }`}
                                    key={item.id}
                                    >
                                        <label className="item-checkbox">
                                            <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => toggleItem(item.id)}
                                            />

                                            <span className="custom-checkbox"
                                            aria-hidden="true">{item.checked ? "✓" : ""}</span>
                                        </label>

                                        <span className="grocery-emoji"
                                        aria-hidden="true">{item.emoji}</span>
                                        <span className="grocery-name">{item.name}</span>
                                        <span className="grocery-quantity">
                                            {item.quantity}
                                        </span>

                                        <button
                                        className="remove-item"
                                        aria-label={`Remove ${item.name}`}
                                        onClick={() =>
                                            setItems((current) =>
                                            current.filter(
                                                (entry) => entry.id !== item.id
                                            ))
                                        }
                                        >x</button>
                                    </div>
                                ))}
                            </div>
                            </section>
                        ))) : (
                            <div className="empty-list">
                                <span>🥄</span>

                                <strong>
                                    {activeCategory === "All Items"
                                    ? "Your list is empty"
                                    : `No ${activeCategory.toLowerCase()} items yet`}
                                </strong>

                                <p>
                                    Add a grocery item to get your list started.
                                </p>

                                <button className="primary-button"
                                onClick={() => setShowAddForm(true)}
                                >
                                    Add an item
                                </button>
                            </div>
                        )}
                </section>

                <aside className="shopping-sidebar">
                    <section className="progress-card">
                        <h2>
                            <span>🛒</span> Shopping Progress
                        </h2>

                        <div className="progress-summary">
                            <div>
                                <strong>{totalCount} items</strong>
                                <span>{checkedCount} / {totalCount} checked off</span>
                            </div>

                            <div className="progress-ring"
                            style={{ "--progress": `${progress}%` }}
                            >
                                <div>{progress}%</div>
                            </div>
                        </div>

                        <div className="progress-divider"/>
                        <span className="estimated-label">
                            Estimated Total
                        </span>

                        <strong className="estimated-total">
                            ${estimatedTotal.toFixed(2)}
                        </strong>
                    </section>

                    <section className="quick-actions-card">
                        <h2>Quick Actions</h2>

                        <button className={`primary-button quick-action-main ${
                            shoppingMode ? "quick-action-main--active" : ""
                            }`}
                            onClick={() =>
                            setShoppingMode((value) => !value)
                        } >
                            🛒{" "}
                            {shoppingMode
                            ? "Exit Shopping Mode"
                        : "Shop Now"}
                            </button>      

                            <button className="outline-button" onClick={clearCompleted}>
                                <span>Clear Completed</span>
                            </button>

                            <button
                            className="outline-button"
                            onClick={clearList}
                            >
                                <span>Clear List</span>
                            </button>

                            {shoppingMode && (
                                <p className="shopping-mode-note">
                                    Shopping mode is on. Check off each item as you shop!
                                </p>
                            )}
                    </section>

                    <section
    className={`suggestion-banner ${
        showSuggestionBanner ? "" : "suggestion-banner--hidden"
    }`}
    aria-hidden={!showSuggestionBanner}
>
    <div className="suggestion-icon">🛒</div>

    <div className="suggestion-content">
        <div className="suggestion-heading">
            <div>
                <strong>Running low?</strong>
                <p>Keep your kitchen stocked with these essentials.</p>
            </div>
        </div>

        <div className="suggestion-items">
            {suggestions.map((item) => (
                <div className="suggestion-item" key={item.name}>
                    <span className="suggestion-emoji">{item.emoji}</span>
                    <span>{item.name}</span>
                    </div>
            ))}
        </div>

        <button className="primary-button suggestion-add"
        onClick={addSuggestedItems}>+ Add suggested items</button>
    </div>

    <button
    className="banner-close"
    aria-label="Hide suggestions"
    onClick={() => setShowSuggestionBanner(false)}>x</button>
    {/* write */}
</section>
                </aside>
            </div>

            {showAddForm && (
                <div
                className="modal-backdrop"
                onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                setShowAddForm(false);
            }
                }}
                >
                    <form
                    className="add-item-modal"
                    onSubmit={handleAddSubmit}
                    >
                        <button 
                        type="button"
                        className="modal-close"
                        aria-label="Close"
                        onClick={() => setShowAddForm(false)}
                        >x</button>

                        <span className="modal-kicker">
                            GROCERYBUDDY
                        </span>

                        <h2>Add to your list</h2>

                        <p>What do you need from the store?</p>

                        <label>
                            Item className
                            <input
                            autoFocus
                            value={newItem.name}
                            onChange={(event) =>
                                setNewItem({
                                    ...newItem,
                                    name: event.target.value,
                                })
                            }
                            placeholder="e.g Strawberries"
                            required
                        />
                        </label>

                        <div className="modal-fields-row">
                            <label>
                                Quantity
                                <input
                                value={newItem.quantity}
                            onChange={(event) =>
                                setNewItem({
                                ...newItem,
                                quantity: event.target.value,
                                })
                                    }
                                placeholder="1 pack"
                                    />
                            </label>
                            
                            <label>Category

                                <select
                                value={newItem.category}
                                onChange={(event) =>
                                setNewItem({
                                ...newItem,
                                category: event.target.value,
                                    })
                                    }
                                >
                            {categories.slice(1).map((category) => (
                            <option key={category}>
                                {category}
                                </option>
                                ))}

                            <option value="Auto-detect">
                                Auto-detect
                            </option>
                            </select>
                            </label>
                        </div>

                        <label>
                            Estimated price {" "}
                            <span className="optional-label">
                                (optional)
                            </span>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newItem.price}
                                onChange={(event) =>
                            setNewItem({
                            ...newItem,
                                price: event.target.value,
                                })
                            }
                            placeholder="0.00"
                        />
                        </label>

                        <div className="modal-actions">
                            <button
                            type="button"
                            className="outline-button"
                            onClick={() => setShowAddForm(false)}>
                                Cancel
                            </button>
                            <button
                            type="submit"
                            className="primary-button">+ Add Item</button>
                        </div>
                    </form>
                </div>
            )}
        </main>
        </div>
    );
}