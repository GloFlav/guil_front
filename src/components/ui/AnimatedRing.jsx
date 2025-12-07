const AnimatedRing = () => {
    return (
        <div>
            {/* animated ring */}
            <span className="relative flex items-center justify-center w-10 h-10">
                <span aria-hidden="true" className="absolute inset-0 rounded-full animate-ringPulse" style={{ backgroundColor: "transparent" }} />
                <svg className="relative z-10 w-10 h-10 animate-rotateRing" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                    <circle cx="24" cy="24" r="18" stroke="#ffffff" strokeWidth="4" opacity="0.95" />
                    <path d="M6 24a18 18 0 0 1 36 0" stroke="#405969" strokeWidth="4" strokeLinecap="round" strokeDasharray="85" strokeDashoffset="20" fill="none" />
                    <circle cx="24" cy="24" r="6" fill="#5DA781" />
                </svg>
            </span>
        </div>
    )
}

export default AnimatedRing