export default function NavBar({ setIsUploading, setHasSubmitted }) {
    
    return (
        <nav className="navbar">
            <button onClick={() => {
                setIsUploading(false)
                setHasSubmitted(false)
                }}>Upload</button>
            <button onClick={() => {
                setIsUploading(false)
                setHasSubmitted(true)
                }}>Collection</button>
        </nav>
    )
}