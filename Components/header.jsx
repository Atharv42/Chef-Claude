import React from 'react'
export default function Header(){
    return(
        <header className="header">
            <img src="https://github.com/scrimba/learn-react/blob/main/03.%20React%20State/02.%20Chef%20Claude%20-%20Header/images/chef-claude-icon.png?raw=true" alt="Chef Claude Icon" className="header-image"/>
            <h1 className="header-title">Chef Claude</h1>
            <br/>
            <p className="header-text">Your personal recipe assistant</p>
        </header>
    )
}