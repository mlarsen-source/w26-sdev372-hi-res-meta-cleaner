interface NavBarProps {
  setIsUploading: (value: boolean) => void;
  setHasSubmitted: (value: boolean) => void;
}

export default function NavBar({ setIsUploading, setHasSubmitted }: NavBarProps) {
    
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