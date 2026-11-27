import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react'
import { supabase, useSession } from '../supabase'
import Sidebar from "../pages/Sidebar";
import Onboarding from '../pages/Onboarding.jsx'
import "./Settings.css"

function Settings(){
    const navigate = useNavigate();

    const settingsSections =[
        {
        title: "Account",
        items: [
            {
                icon: "👥",
                name: "Personal Information",
                description: "View your details",
            },
        ],
    },
    {
        title: "Grocery Preferences",
        items: [
            {
                icon: "📃",
                name: "My Grocery Profile",
                description: "Review or edit your onboarding information",
                action: () => navigate("/onboarding?mode=edit"),
            },
        ],
    },
    ];
    const [showPersonalInfo, setShowPersonalInfo] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const savedAnswers = JSON.parse(
        localStorage.getItem("groceryBuddyAnswers") || "{}"
    )
    const [userEmail, setUserEmail] = useState("");
    const [createdAt, setCreatedAt] = useState("");
    const [lastLogin, setLastLogin] = useState("");
    const [googleName, setGoogleName] = useState("");
    const displayUserName = savedAnswers.name.charAt().toUpperCase() + savedAnswers.name.slice(1).toLowerCase() || "Not provided"
    const displayFullName = googleName || "Not provided"

    useEffect(() => {
        async function getUserEmail() {
            const{ data, error } = await supabase.auth.getUser();

            if(error) {
                console.error("Could not get user: ", error.message);
                return;
            }
            setUserEmail(data.user?.email || "");
            setCreatedAt(data.user?.created_at || "");
            setLastLogin(data.user?.last_sign_in_at || "");
            setGoogleName(data.user?.user_metadata?.full_name ||
                data.user?.user_metadata?.name ||
                ""
            );
        }
        getUserEmail();
    }, []);
    return (
        <div className="settings-layout">
            <Sidebar />
            <main className="settings-main">
                <div className="settings-header">
                    <h1>Settings</h1>
                    <p>Manage your account and GroceryBuddy experience</p>
                </div>

                <div className="settings-content">
                    {settingsSections.map((section) => (
                        <section className="settings-card" key={section.title}>
                            <h2>{section.title}</h2>

                            <div className="settings-items">
                                {section.items.map((item) => (
                                    <div key={item.name}>
                                    <button
                                    className="settings-item"
                                    key={item.name}
                                    type="button"
                                    onClick={() => {
                                        if(item.name === "Personal Information"){
                                            setShowPersonalInfo(!showPersonalInfo);
                                        } else {
                                            item.action?.();
                                        }
                                    }}
                                    >
                                        <span className="settings-icon">
                                            {item.icon}
                                        </span>

                                        <span className="settings-item-text">
                                            <strong>{item.name}</strong>
                                            <small>{item.description}</small>
                                        </span>

                                        <span className="settings-arrow">
                                        {item.name === "Personal Information" && showPersonalInfo ? "⌄" : "›"}
                                        </span>
                                    </button>

                                    {item.name === "Personal Information" && (
                                        <div className={`personal-info-details ${showPersonalInfo ? "open" : ""}`}>
                                        <p><strong>Name: </strong>{displayFullName}</p>
                                        <p><strong>Preferred Name: </strong>{displayUserName}</p>
                                        <p><strong>Email: </strong>{userEmail || "Not available"}</p>
                                        <p>
                                            <strong>Account Created: </strong>{" "}
                                            {createdAt
                                            ? new Date(createdAt).toLocaleDateString()
                                        : "Not available"}
                                        </p>
                                        <p>
                                            <strong>Last Login: </strong>{" "}
                                            {lastLogin
                                            ? new Date(lastLogin).toLocaleDateString()
                                        : "Not available"}
                                        </p>
                                        </div>
                                    )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}

                    <section className="settings-card settings-account-actions">
                        <h2>Account Actions</h2>

                        <button className="settings-action logout-action"
                        type="button">Sign Out</button>
                        <button className="settings-action delete-action"
                        type="button"
                        onClick={() => setShowDeleteModal(true)}>
                            Delete Account
                        </button>
                        {showDeleteModal && (
                            <div className="delete-modal-overlay">
                                <div className="delete-modal">
                                    <h2>Delete your Account?</h2>
                                    <p>
                                        Are you sure you want to delete your account? 
                                        This is permanent and cannot be undone. 
                                    </p>
                                    <div className="delete-modal-buttons">
                                        <button
                                        className="cancel-delete-button"
                                        onClick={() => setShowDeleteModal(false)}
                                        >Cancel
                                        </button>
                                        <button
                                        className="confirm-delete-button"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                        
                                        }}>Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}

export default Settings;