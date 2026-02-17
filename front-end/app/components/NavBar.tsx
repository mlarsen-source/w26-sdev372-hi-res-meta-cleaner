import HeaderAuth from "./HeaderAuth";

interface NavBarProps {
  setIsUploading: (value: boolean) => void;
  setHasSubmitted: (value: boolean) => void;
  hasSubmitted: boolean;
  showActive?: boolean;
  showNavActions?: boolean;
  activeAuth?: "login" | "register";
}

export default function NavBar({
  setIsUploading,
  setHasSubmitted,
  hasSubmitted,
  showActive = true,
  showNavActions = true,
  activeAuth,
}: NavBarProps) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        {showNavActions && (
          <div className="nav-actions">
            <button
              className={showActive && !hasSubmitted ? "active" : ""}
              onClick={() => {
                setIsUploading(false);
                setHasSubmitted(false);
              }}
            >
              Home
            </button>
            <button
              className={showActive && hasSubmitted ? "active" : ""}
              onClick={() => {
                setIsUploading(false);
                setHasSubmitted(true);
              }}
            >
              View Collection
            </button>
          </div>
        )}
      </div>
      <HeaderAuth activeAuth={activeAuth} />
    </nav>
  );
}
