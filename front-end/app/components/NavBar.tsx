import { useState } from "react"

export default function NavBar({ uploading, submited }) {
    
    return (
        <nav className="navbar">
            <button onClick={() => {
                uploading(false)
                submited(false)
                }}>Upload</button>
            <button onClick={() => {
                uploading(false)
                submited(true)
                }}>Collection</button>
        </nav>
    )
}