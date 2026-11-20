import React, { useState } from 'react';
import "./PriorWastes.css";
import Sidebar from "./Sidebar.jsx";

const foodStats = {
    wasted: "4.2 lbs",
    consumed: "38 lbs",
    purchased: 52,
    wasteCost: "18.50",
};

const foodBreakdown = [
{name: "Consumed" , value: 82, color: "#4F936B"},
{name: "Wasted", value: 18, color: "#D9A16A"},
];

const wasteCategories = [
    { name: "Produce", value: 55, color: "#4F936B"},
    { name: "Dairy", value: 25, color: "#A8C98C"},
    { name: "Pantry", value: 12, color: "#E6C77A"},
    { name: "Other", value: 8, color: "#D9A16A"},
];

const purchaseCategories = [
    { name: "Produce", value: 40, color: "#4F936B"},
    { name: "Dairy", value: 30, color: "#A8C98C"},
    { name: "Pantry", value: 20, color: "#E6C77A"},
    { name: "Frozen", value: 10, color: "#8BB8C5"},


];

const frequentFoods = [
        { name: "Bananas", purchases: 12 },
        { name: "Milk", purchases: 9},
        { name: "Strawberries", purchases: 7},
        { name: "Bread", purchases: 6},
        { name: "Egges", purchases: 5},

];


function DonutChart({data, centerValue, centerLabel}) {
    let currentPercentage = 0;

    const gradient = data.map((item) => {
        const start = currentPercentage;
        currentPercentage += item.value;

        return `${item.color} ${start}% ${currentPercentage}%`;
    }).join (", ");

    return (
        <div className="donut-wrapper">
            <div
            className="donut-chart"
            style={{ background: `conic-gradient(${gradient})` }}
            role="img"
            aria-label={data.map(
                (item) => `${item.name} : ${item.value}%`
            ).join(", ")}
            >
                <div className="donut-center">
                    <strong>{centerValue}</strong>
                    <span>{centerLabel}</span>
                </div>
            </div>
        </div>
    );
}

function ChartLegend({ data }){
    return (
        <div className="chart-legend">
            {data.map((item) => (
                <div className="legend-item" key={item.name}>
                    <span
                    className="legend-dot"
                    style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <strong>{item.value}</strong>
                    </div>
            ))}
        </div>
    );
}

export default function PriorWastes(){
const [loading, setLoading] = useState(true);
const[wasteData, setWasteData] = useState(null);
const [totalWasted, setTotalWasted] = useState(100);
const [selectedPeriod, setSelectedPeriod] = useState("This Month");
    return (
        <div className="dash-shell">
            <Sidebar />

            <main className="insights-page">
                <header className="insights-heading">
                    <div>
                        <h1>Prior Wastes</h1>
                        <p>
                            Understand your habits. Waste less. Save more.
                        </p>
                    </div>

                    <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                        <option>This week</option>
                        <option>This month</option>
                        <option>Last 3 months</option>
                        <option>This year</option>
                    </select>
                </header>

                <section className="insights-stats">
                    <article className="insight-stat-card">
                        <span className="stat-icon">🗑️</span>
                        <span className="stat-label">Food wasted</span>
                        <strong>{foodStats.wasted}</strong>
                        <span className="stat-note">
                            {selectedPeriod}
                        </span>
                    </article>

                    <article className="insight-stat-card">
                        <span className="stat-icon">🍴</span>
                        <span className="stat-label">Food eaten</span>
                        <strong>{foodStats.consumed}</strong>
                        <span className="stat-note">
                            {selectedPeriod}
                        </span>
                    </article>

                    <article className="insight-stat-card">
                        <span className="stat-icon">🛒</span>
                        <span className="stat-label">Items purchased</span>
                        <strong>{foodStats.purchased}</strong>
                        <span className="stat-note">
                            {selectedPeriod}
                        </span>
                    </article>

                    <article className="insight-stat-card">
                        <span className="stat-icon">💵</span>
                        <span className="stat-label">Waste cost</span>
                        <strong>{foodStats.wasteCost}</strong>
                        <span className="stat-note">Estimated value</span>
                    </article>
                </section>

                <section className="insights-card main-breakdown">
                    <div className="insights-card-heading">
                        <div>
                            <h2>Your Food Breakdown</h2>
                            <p>How your recorded food was used</p>
                        </div>
                        <span className="insight-tag">{selectedPeriod}</span>
                    </div>

                    <div className="main-chart-layout">
                        <DonutChart
                        data={foodBreakdown}
                        centerValue={`${foodBreakdown[0].value}%`}
                        centerLabel="Consumed"
                        />
                        <div className="main-chart-details">
                            {foodBreakdown[0].value > foodBreakdown[1].value ? (
                                <>
                                <h3>You're making progress!</h3>
                                <p>Most of your recorded food was consumed instead of wasted!</p>
                                </>
                            ) : (
                                <>
                                <h3>There is room for improvement!</h3>
                                <p>Most of your recorded food was wasted instead of consumed.</p>
                                </>
                            )
                                }
                            
                            <ChartLegend data={foodBreakdown} />
                        </div>
                    </div>
                </section>

                <section className="category-chart-grid">
                    <article className="insights-card category-chart-card">
                        <div className="insights-card-heading">
                            <div>
                                <h2>Waste by Category</h2>
                                <p>Where your waste comes from</p>
                            </div>
                        </div>

                        <DonutChart
                        data={wasteCategories}
                        centerValue={totalWasted}
                        centerLabel="Items"
                        />

                        <ChartLegend data={wasteCategories} />
                    </article>

                    <article className="insights-card category-chart-card">
                        <div className="insights-card-heading">
                            <div>
                                <h2>Shopping Habits</h2>
                                <p>Purchases by food category</p>
                            </div>
                        </div>

                        <DonutChart
                        data={purchaseCategories}
                        centerValue="100"
                        centerLabel="Purchases"
                        />
                        <ChartLegend data={purchaseCategories} />
                    </article>
                </section>

                <section className="insights-card frequent-foods-card">
                    <div className="insights-card-heading">
                        <div>
                            <h2>Most Frequently Purchased</h2>
                            <p>Your grocery shopping favorites</p>
                        </div>
                    </div>

                    <div className="frequent-foods-list">
                        {frequentFoods.map((food) => (
                            <div className="frequent-food-row"
                            key={food.name}>

                                <div className="frequent-food-info">
                                    <strong>{food.name}</strong>
                                    <span>Purchased {food.purchases} times </span>
                                </div>

                                <div className="purchase-bar">
                                    <div className="purchase-bar-fill"
                                    style={{
                                        width: `${(food.purchases / 12) * 100}%`
                                    }}
                                    />
                                </div>

                                <strong className="purchase-count">
                                    {food.purchases}
                                </strong>
                                </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}